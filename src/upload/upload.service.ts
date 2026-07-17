import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private client = new S3Client({
    region: 'auto',

    endpoint:
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
  });

  async uploadAudio(file: Express.Multer.File) {

    if (!file)
      throw new BadRequestException('No file');

    const ext = file.originalname.split('.').pop();

    const key = `tracks/${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: `${process.env.R2_PUBLIC_URL}/${key}`,
      key,
    };
  }
}
