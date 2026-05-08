import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const config = new ConfigService({
    STORAGE_PUBLIC_BASE_URL: 'http://localhost:9000',
    STORAGE_BUCKET: 'rcar-documents',
    STORAGE_SIGNING_SECRET: 'test-secret',
    STORAGE_SIGNED_URL_TTL_SECONDS: '900',
  });

  it('creates upload metadata with signed PUT url', () => {
    const service = new StorageService(config);

    const result = service.createUploadRequest({
      fileName: 'CNH Frente.jpg',
      contentType: 'image/jpeg',
      folder: 'customers',
      expiresInSeconds: 300,
    });

    expect(result.objectKey).toMatch(/^customers\/[0-9a-f-]+-cnh-frente.jpg$/);
    expect(result.uploadUrl).toContain('method=PUT');
    expect(result.uploadUrl).toContain('sig=');
    expect(result.bucket).toBe('rcar-documents');
    expect(result.headers['Content-Type']).toBe('image/jpeg');
  });

  it('creates signed GET url with attachment filename', () => {
    const service = new StorageService(config);

    const result = service.getSignedDownloadUrl({
      objectKey: 'documents/abc123-contrato.pdf',
      downloadName: 'Contrato Maio.pdf',
      expiresInSeconds: 600,
    });

    expect(result.signedUrl).toContain('method=GET');
    expect(result.signedUrl).toContain('response-content-disposition=attachment%3B+filename%3D%22contrato-maio.pdf%22');
  });
});


