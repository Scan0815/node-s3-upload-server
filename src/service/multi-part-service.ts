import * as AWS from "aws-sdk";
import { orderBy } from "lodash";
import {Request, Response} from 'express';
import * as env from "../.env.json";

export class MultiPartService {
 private s3Endpoint = new AWS.Endpoint(env.s3.endPoint);
 private s3Credentials = new AWS.Credentials({
   accessKeyId: env.s3.accessKeyId,
   secretAccessKey: env.s3.secretAccessKey,
 });
 private aws = new AWS.S3({
    endpoint: this.s3Endpoint,
    credentials: this.s3Credentials,
    signatureVersion: "v4"
 });
  constructor() {
      console.log("init Upload Server");
  }

  async initializeMultipartUpload(req:Request, res:Response) {
    const { name, contentType } = req.body

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

  async getMultipartPreSignedUrls(req:Request, res:Response) {
    const { fileKey, fileId, parts } = req.body

    const multipartParams = {
      Bucket: env.s3.bucketName,
      Key: fileKey,
      UploadId: fileId,
    }

    const promises = []

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

  async finalizeMultipartUpload(req:Request, res:Response) {
    const { fileId, fileKey, parts } = req.body

    const multipartParams = {
      Bucket: env.s3.bucketName,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        // ordering the parts to make sure they are in the right order
        Parts: orderBy(parts, ["PartNumber"], ["asc"]),
      },
    }

    await this.aws.completeMultipartUpload(multipartParams).promise()

    res.send()
  }
}
