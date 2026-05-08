import { StorageController } from './storage.controller';

describe('StorageController', () => {
  it('delegates upload request creation', async () => {
    const createUploadRequest = jest.fn().mockResolvedValue({ objectKey: 'documents/test-file' });
    const controller = new StorageController({ createUploadRequest } as never);

    const result = await controller.createUpload({
      fileName: 'test.pdf',
      contentType: 'application/pdf',
    });

    expect(createUploadRequest).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      contentType: 'application/pdf',
    });
    expect(result).toEqual({ objectKey: 'documents/test-file' });
  });

  it('delegates signed url generation', async () => {
    const getSignedDownloadUrl = jest.fn().mockResolvedValue({ signedUrl: 'http://localhost/mock' });
    const controller = new StorageController({ getSignedDownloadUrl } as never);

    const result = await controller.getSignedUrl({ objectKey: 'documents/test-file' });

    expect(getSignedDownloadUrl).toHaveBeenCalledWith({ objectKey: 'documents/test-file' });
    expect(result).toEqual({ signedUrl: 'http://localhost/mock' });
  });
});


