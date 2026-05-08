import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const api = {
    post: vi.fn(),
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('uploads file using presigned url from backend', async () => {
    const service = TestBed.inject(StorageService);
    api.post.mockReturnValue(of({
      objectKey: 'customers/file.jpg',
      uploadUrl: 'https://storage/upload',
      headers: { 'Content-Type': 'image/jpeg' },
      bucket: 'rcar-documents',
      expiresAt: new Date().toISOString(),
    }));

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['a'], 'file.jpg', { type: 'image/jpeg' });
    const result = await service.uploadFile(file, 'customers');

    expect(api.post).toHaveBeenCalledWith('/storage/uploads', {
      fileName: 'file.jpg',
      contentType: 'image/jpeg',
      folder: 'customers',
    });
    expect(fetchMock).toHaveBeenCalledWith('https://storage/upload', expect.objectContaining({ method: 'PUT' }));
    expect(result.objectKey).toBe('customers/file.jpg');
  });

  it('returns signed download url', async () => {
    const service = TestBed.inject(StorageService);
    api.get.mockReturnValue(of({
      objectKey: 'customers/file.jpg',
      signedUrl: 'https://storage/download',
      bucket: 'rcar-documents',
      expiresAt: new Date().toISOString(),
    }));

    const url = await service.getDownloadUrl('customers/file.jpg', 'CNH.pdf');

    expect(api.get).toHaveBeenCalledWith('/storage/signed-url?objectKey=customers%2Ffile.jpg&downloadName=CNH.pdf');
    expect(url).toBe('https://storage/download');
  });
});

