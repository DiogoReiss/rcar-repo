import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const config = new ConfigService({
    STORAGE_ENDPOINT: 'http://localhost:9000',
    STORAGE_REGION: 'us-east-1',
    STORAGE_ACCESS_KEY: 'minioadmin',
    STORAGE_SECRET_KEY: 'minioadmin',
    STORAGE_BUCKET: 'rcar-documents',
    STORAGE_SIGNED_URL_TTL_SECONDS: '900',
  });

  it('creates upload metadata with signed PUT url', async () => {
    const service = new StorageService(config);

    const result = await service.createUploadRequest({
      fileName: 'CNH Frente.jpg',
      contentType: 'image/jpeg',
      folder: 'customers',
      expiresInSeconds: 300,
    });

    expect(result.objectKey).toMatch(/^customers\/[0-9a-f-]+-cnh-frente.jpg$/);
    expect(result.uploadUrl).toContain('X-Amz-Signature=');
    expect(result.uploadUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(result.bucket).toBe('rcar-documents');
    expect(result.headers['Content-Type']).toBe('image/jpeg');
  });

  it('creates signed GET url with attachment filename', async () => {
    const service = new StorageService(config);

    const result = await service.getSignedDownloadUrl({
      objectKey: 'documents/abc123-contrato.pdf',
      downloadName: 'Contrato Maio.pdf',
      expiresInSeconds: 600,
    });

    expect(result.signedUrl).toContain('X-Amz-Signature=');
    expect(result.signedUrl).toContain(
      'response-content-disposition=attachment%3B%20filename%3D%22contrato-maio.pdf%22',
    );
  });
});
