import aws from 'aws-sdk';
import { s3Info } from '../config.js';
import fs from 'fs';

export const s3 = new aws.S3({
    accessKeyId: s3Info.accessKeyId,
    secretAccessKey: s3Info.secretAccessKey,
    endpoint: new aws.Endpoint(s3Info.endpoint)
})

export function uploadImage(image){
    const imageStream = fs.createReadStream(image.path);

    const params = {
        Bucket: s3Info.bucketName,
        Key: image.filename,
        ACL: "public-read",
        ContentType: image.mimetype,
        Body: imageStream
    }

    return s3.upload(params).promise();

}