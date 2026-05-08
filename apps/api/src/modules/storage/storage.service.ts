import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto.js';
import { GetSignedUrlQueryDto } from './dto/get-signed-url-query.dto.js';

const DEFAULT_SIGNED_TTL_SECONDS = 900;
const MAX_SIGNED_TTL_SECONDS = 3600;

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  createUploadRequest(dto: CreateUploadRequestDto) {
    const objectKey = this.buildObjectKey(dto.fileName, dto.folder);
    const expiresInSeconds = this.resolveTtl(dto.expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      objectKey,
      bucket: this.bucket,
      uploadUrl: this.buildSignedUrl({
        objectKey,
        method: 'PUT',
        expiresInSeconds,
        contentDisposition: undefined,
      }),
      headers: {
        'Content-Type': dto.contentType,
      },
      expiresAt,
    };
  }

  getSignedDownloadUrl(query: GetSignedUrlQueryDto) {
    const expiresInSeconds = this.resolveTtl(query.expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      objectKey: query.objectKey,
      bucket: this.bucket,
      signedUrl: this.buildSignedUrl({
        objectKey: query.objectKey,
        method: 'GET',
        expiresInSeconds,
        contentDisposition: query.downloadName
          ? `attachment; filename="${this.normalizeSegment(query.downloadName)}"`
          : undefined,
      }),
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

  private buildSignedUrl(params: {
    objectKey: string;
    method: 'GET' | 'PUT';
    expiresInSeconds: number;
    contentDisposition?: string;
  }): string {
    const exp = Math.floor(Date.now() / 1000) + params.expiresInSeconds;
    const payload = `${params.method}|${params.objectKey}|${exp}|${params.contentDisposition ?? ''}`;
    const signature = createHmac('sha256', this.signingSecret).update(payload).digest('hex');

    const encodedObjectKey = encodeURIComponent(params.objectKey);
    const basePath = `${this.publicBaseUrl}/${this.bucket}/${encodedObjectKey}`;
    const search = new URLSearchParams({
      method: params.method,
      exp: String(exp),
      sig: signature,
    });

    if (params.contentDisposition) {
      search.set('response-content-disposition', params.contentDisposition);
    }

    return `${basePath}?${search.toString()}`;
  }

  private normalizeSegment(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_.]/g, '');
  }

  private get signingSecret(): string {
    return this.configService.get('STORAGE_SIGNING_SECRET') ?? 'rcar-storage-dev-secret';
  }

  private get bucket(): string {
    return this.configService.get('STORAGE_BUCKET') ?? 'rcar-documents';
  }

  private get publicBaseUrl(): string {
    return (this.configService.get('STORAGE_PUBLIC_BASE_URL') ?? 'http://localhost:9000').replace(/\/$/, '');
  }
}

