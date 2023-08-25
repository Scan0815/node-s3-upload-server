let env = require("../.env.json");
import * as Sentry from "@sentry/node";
import { S3Client, CreateMultipartUploadCommand, CompleteMultipartUploadCommand, UploadPartCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { S3RequestPresigner, getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Request, Response } from 'express';
import { orderBy } from "lodash";
import {Converter} from "./converter-service";
import {MongodbService} from "./mongodb-service";

export class MultiPartService {
    private readonly s3: S3Client;
    private presigner: S3RequestPresigner;
    private mongoDb = new MongodbService(
        env.mongoDb.url,
        env.mongoDb.database,
        env.mongoDb.username,
        env.mongoDb.passwort,
        env.mongoDb.port);
    private convertService = new Converter(env.cloudConvert.apiKey, env.cloudConvert.sandbox, env.s3.bucketName, env.s3.region, env.s3.accessKeyId, env.s3.secretAccessKey, env.s3.endPoint);
    constructor() {
        this.s3 = new S3Client({
            region: env.s3.region,
            endpoint: env.s3.endPoint,
            credentials: {
                accessKeyId: env.s3.accessKeyId,
                secretAccessKey: env.s3.secretAccessKey,
            },
        });
        this.presigner = new S3RequestPresigner(this.s3.config);
        console.log("init Upload Server");
    }

    async initializeMultipartUpload(req: Request, res: Response): Promise<void> {
        const { name, contentType } = req.body;
        const command = new CreateMultipartUploadCommand({
            Bucket: env.s3.bucketName,
            Key: name,
            ContentType: contentType,
        });

        const multipartUpload = await this.s3.send(command);
        res.send({
            fileId: multipartUpload.UploadId,
            fileKey: multipartUpload.Key,
        });
    }

    async getMultipartPreSignedUrls(req: Request, res: Response): Promise<void> {
        const { fileKey, fileId, parts } = req.body;
        const signedUrls: Array<{ signedUrl: string; PartNumber: number }> = [];

        for (let i = 0; i < parts; i++) {
            const command = new UploadPartCommand({
                Bucket: env.s3.bucketName,
                Key: fileKey,
                UploadId: fileId,
                PartNumber: i + 1,
            });

            const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
            signedUrls.push({
                signedUrl: signedUrl,
                PartNumber: i + 1,
            });
        }

        res.send(signedUrls);
    }

    async finalizeMultipartUpload(req: Request, res: Response): Promise<void> {

        const { fileId, fileKey, fileType, transferId, parts, transfer } = req.body;
        const command = new CompleteMultipartUploadCommand({
            Bucket: env.s3.bucketName,
            Key: fileKey,
            UploadId: fileId,
            MultipartUpload: {
                Parts: orderBy(parts, ["PartNumber"], ["asc"]),
            },
        });

        try {
            const storage = await this.s3.send(command);
            const fileFromS3 = (storage.Key as string);
            let pathObj:any = {};

            if(fileType.includes("audio")){
                await this.mongoDb.saveObject(env.mongoDb.collection,{
                    transfer,
                    storage,
                    pathObj,
                    convertingStatus:"start",
                    transferId: transferId,
                    fileId: fileId
                });
                await this.mongoDb.saveObject(env.mongoDb.collection,{
                    transfer,
                    storage,
                    pathObj,
                    convertingStatus:"finished",
                    transferId: transferId,
                    fileId: fileId
                });
            }

            if (fileType.includes("video") || fileType.includes("image/gif")) {
                pathObj = {
                    images : `${transferId}/images/${fileId}`,
                    converted : `${transferId}/converted/${fileId}`,
                    thumbnail : `${transferId}/thumbnail/${fileId}`,
                }

                const exportPath = `${pathObj.converted}/${fileKey.replace(/\.[^.]+$/, '.mp4')}`;
                const mediaInfos = await this.convertService.getVideoInfos(fileFromS3)
                const primaryColor = await this.convertService.getPrimaryColor(fileFromS3,"video");

                await this.mongoDb.saveObject(env.mongoDb.collection,{
                    transfer,
                    storage,
                    pathObj,
                    exportPath,
                    ...mediaInfos,
                    primaryColor,
                    convertingStatus:"start",
                    transferId: transferId,
                    fileId: fileId
                });
                await this.convertService.cloudConvertVideo(fileFromS3,exportPath,async() => {

                    console.log("cloudConvertVideo finished")
                    const command = new GetObjectCommand({
                        Bucket: env.s3.bucketName,
                        Key: exportPath,
                    })

                    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 })

                    await this.convertService.extractImagesFromVideo(
                        signedUrl,
                        pathObj.images,
                        `${pathObj.thumbnail}/${fileKey.replace(/\.[^.]+$/, '.jpg')}`,
                        async (event)=>{
                            env.debug && console.log(event);
                            await this.mongoDb.saveObject(env.mongoDb.collection,{
                                transfer,
                                storage,
                                ...mediaInfos,
                                primaryColor,
                                exportPath,
                                pathObj,
                                convertingStatus:"finished",
                                transferId: transferId,
                                fileId: fileId
                            });
                        },
                        async (event)=>{
                            env.debug && console.log(event);
                        }
                    )
                });

            }

            if (fileType.includes("image") && !fileType.includes("gif")) {
                pathObj = {
                    images : `${transferId}/images/${fileId}`
                }

                const primaryColor = await this.convertService.getPrimaryColor(fileFromS3,"image");

                await this.mongoDb.saveObject(env.mongoDb.collection,{
                    transfer,
                    storage,
                    pathObj,
                    primaryColor,
                    convertingStatus:"start",
                    transferId: transferId,
                    fileId: fileId
                });

                await this.convertService.createImages(fileFromS3, pathObj.images, transfer.exIf.crop,
                async (event) => {
                    env.debug && console.log(event);
                    await this.mongoDb.saveObject(env.mongoDb.collection,{
                        transfer,
                        storage,
                        pathObj,
                        primaryColor,
                        transferId: transferId,
                        convertingStatus:"finished",
                        fileId: fileId
                    });
                },
                async (event)=>{
                    env.debug && console.log(event);
                });
            }

        } catch (e) {
            env.debug &&  console.log(e);
            Sentry.captureException(e);
            await this.mongoDb.saveObject(env.mongoDb.collection,{
                transfer,
                error: e, 
                convertingStatus:"failed",
                transferId: transferId,
                fileId: fileId
            });
        }

        res.send();
    }
}