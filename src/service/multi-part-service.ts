import * as AWS from "aws-sdk";
import {orderBy} from "lodash";
import {Request, Response} from 'express';

let env = require("../.env.json");
import {Kafka, Partitioners} from "kafkajs";
import {Converter} from "./converter-service";

export class MultiPartService {
    private kafka = new Kafka(env.kafka.init);
    private s3Endpoint = new AWS.Endpoint(env.s3.endPoint);
    private s3Credentials = new AWS.Credentials({
        accessKeyId: env.s3.accessKeyId,
        secretAccessKey: env.s3.secretAccessKey,
    });
    private convertService = new Converter(env.cloudConvert.apiKey, env.cloudConvert.sandbox, env.s3.bucketName, env.s3.region, env.s3.accessKeyId, env.s3.secretAccessKey, env.s3.endPoint);

    private aws = new AWS.S3({
        endpoint: this.s3Endpoint,
        credentials: this.s3Credentials,
        signatureVersion: "v4"
    });

    constructor() {
        console.log("init Upload Server");
    }

    async initializeMultipartUpload(req: Request, res: Response) {
        const {name, contentType} = req.body

        const multipartParams = {
            Bucket: env.s3.bucketName,
            Key: name,
            ContentType: contentType
        }

        const multipartUpload = await this.aws.createMultipartUpload(multipartParams).promise()

        res.send({
            fileId: multipartUpload.UploadId,
            fileKey: multipartUpload.Key,
        })
    }

    async getMultipartPreSignedUrls(req: Request, res: Response) {
        const {fileKey, fileId, parts} = req.body

        const multipartParams = {
            Bucket: env.s3.bucketName,
            Key: fileKey,
            UploadId: fileId,
        }

        const promises = [];
        for (let index = 0; index < parts; index++) {
            promises.push(
                this.aws.getSignedUrlPromise("uploadPart", {
                    ...multipartParams,
                    PartNumber: index + 1,
                }),
            )
        }

        const signedUrls = await Promise.all(promises)

        const partSignedUrlList = signedUrls.map((signedUrl, index) => {
            return {
                signedUrl: signedUrl,
                PartNumber: index + 1,
            }
        })

        res.send(partSignedUrlList)
    }

    async finalizeMultipartUpload(req: Request, res: Response) {
        const {fileId, fileKey,fileType, transferId, parts, transfer} = req.body

        const multipartParams = {
            Bucket: env.s3.bucketName,
            Key: fileKey,
            UploadId: fileId,
            MultipartUpload: {
                // ordering the parts to make sure they are in the right order
                Parts: orderBy(parts, ["PartNumber"], ["asc"]),
            },
        }
        try {
            const storage = await this.aws.completeMultipartUpload(multipartParams).promise()
            const fileFromS3 = (storage.Key as string);
            const fileName = (transfer.name as string);
            let pathObj:any = {};
            if (fileType.includes("video")) {
                pathObj = {
                    images : `${transferId}/images/${fileId}`,
                    converted : `${transferId}/converted/${fileId}`,
                    thumbnail : `${transferId}/thumbnail/${fileId}`,
                }
                const convert = await this.convertService.convertVideo(
                    fileFromS3,
                    pathObj.images,
                    `${pathObj.converted}/${fileName.replace(/\.[^.]+$/, '.mp4')}`,
                    `${pathObj.thumbnail}/${fileName.replace(/\.[^.]+$/, '.jpg')}`
                )
            }
            if (fileType.includes("image")) {
                pathObj = {
                    images : `${transferId}/images/${fileId}`
                }
                await this.convertService.createImages(fileFromS3, pathObj.images, transfer.exIf.crop);
            }
            const kafkaMessage = {
                topic: env.kafka.topic,
                messages: [{
                    value: JSON.stringify({
                        transfer,
                        storage,
                        pathObj,
                        transferId: transferId,
                        fileId: fileId
                    }),
                    headers: {
                        'transfer-id': transferId
                    }
                }]
            }
            console.log("send over kafka",   kafkaMessage);
            const producer = this.kafka.producer({createPartitioner: Partitioners.LegacyPartitioner})
            await producer.connect()
            await producer.send(kafkaMessage)
            await producer.disconnect()
        } catch (e) {
            console.log(e);
        }

        res.send()
    }
}
