import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto.js';
import { GetSignedUrlQueryDto } from './dto/get-signed-url-query.dto.js';

const DEFAULT_SIGNED_TTL_SECONDS = 900;
const MAX_SIGNED_TTL_SECONDS = 3600;

@Injectable()
export class StorageService {
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
    const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('STORAGE_SECRET_KEY');

    this.s3 = new S3Client({
      region: this.region,
      endpoint,
      // MinIO requires path-style requests; it is also valid for S3-compatible providers.
      forcePathStyle: Boolean(endpoint),
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }

  async createUploadRequest(dto: CreateUploadRequestDto) {
    const objectKey = this.buildObjectKey(dto.fileName, dto.folder);
    const expiresInSeconds = this.resolveTtl(dto.expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: dto.contentType,
      }),
      { expiresIn: expiresInSeconds },
    );

    return {
      objectKey,
      bucket: this.bucket,
      uploadUrl,
      headers: {
        'Content-Type': dto.contentType,
      },
      expiresAt,
    };
  }

  async getSignedDownloadUrl(query: GetSignedUrlQueryDto) {
    const expiresInSeconds = this.resolveTtl(query.expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const signedUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: query.objectKey,
        ResponseContentDisposition: query.downloadName
          ? `attachment; filename="${this.normalizeSegment(query.downloadName)}"`
          : undefined,
      }),
      { expiresIn: expiresInSeconds },
    );

    return {
      objectKey: query.objectKey,
      bucket: this.bucket,
      signedUrl,
      expiresAt,
    };
  }

  private buildObjectKey(fileName: string, folder?: string): string {
    const safeFolder = this.normalizeSegment(folder ?? 'documents') || 'documents';
    const safeFileName = this.normalizeSegment(fileName) || 'file';
    return `${safeFolder}/${randomUUID()}-${safeFileName}`;
  }

  private resolveTtl(ttl?: number): number {
    const envTtl = Number(this.configService.get('STORAGE_SIGNED_URL_TTL_SECONDS') ?? DEFAULT_SIGNED_TTL_SECONDS);
    const raw = ttl ?? envTtl;
    return Math.max(60, Math.min(raw, MAX_SIGNED_TTL_SECONDS));
  }

  private normalizeSegment(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_.]/g, '');
  }

  private get bucket(): string {
    return this.configService.get('STORAGE_BUCKET') ?? 'rcar-documents';
  }

  private get region(): string {
    return this.configService.get('STORAGE_REGION') ?? 'us-east-1';
  }
}

