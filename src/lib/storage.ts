import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageProvider {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  getFileUrl(fileKey: string): Promise<string>;
}

/**
 * LocalStorageProvider
 * 
 * Simulates an AWS S3 bucket using a local directory.
 * Use this for development and testing without AWS credentials.
 */
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(dir = 'uploads') {
    this.uploadDir = dir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileKey = `${Date.now()}-${file.originalname}`;
    const dest = path.join(this.uploadDir, fileKey);
    fs.renameSync(file.path, dest);
    return fileKey;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
    // Return a local URL that our express server will serve
    return `/api/files/${fileKey}`;
  }
}

/**
 * S3StorageProvider
 * 
 * Actual AWS S3 implementation.
 * To use this, change the provider in server.ts and set your environment variables.
 */
export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Initialize S3 client. If keys are missing, the SDK will attempt 
    // to use the default credential provider chain (e.g., IAM roles).
    this.s3Client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        }
      } : {}),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileKey = `${Date.now()}-${file.originalname}`;
    const fileStream = fs.createReadStream(file.path);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileStream,
        ContentType: file.mimetype,
      })
    );

    // After upload, we can delete the temp file from local disk
    fs.unlinkSync(file.path);

    return fileKey;
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      })
    );
  }

  async getFileUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });
    // Return a signed URL valid for 1 hour
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
