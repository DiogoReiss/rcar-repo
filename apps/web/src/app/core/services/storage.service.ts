import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

interface UploadRequest {
  objectKey: string;
  uploadUrl: string;
  headers: {
    'Content-Type': string;
  };
  bucket: string;
  expiresAt: string;
}

interface DownloadRequest {
  objectKey: string;
  signedUrl: string;
  bucket: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly api = inject(ApiService);

  async uploadFile(file: File, folder: string): Promise<{ objectKey: string; fileName: string }> {
    const request = await firstValueFrom(
      this.api.post<UploadRequest>('/storage/uploads', {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder,
      }),
    );

    const response = await fetch(request.uploadUrl, {
      method: 'PUT',
      headers: request.headers,
      body: file,
    });

    if (!response.ok) {
      throw new Error('Falha no upload do arquivo para o storage.');
    }

    return { objectKey: request.objectKey, fileName: file.name };
  }

  async getDownloadUrl(objectKey: string, downloadName?: string): Promise<string> {
    const query = new URLSearchParams({ objectKey });
    if (downloadName) {
      query.set('downloadName', downloadName);
    }

    const result = await firstValueFrom(
      this.api.get<DownloadRequest>(`/storage/signed-url?${query.toString()}`),
    );

    return result.signedUrl;
  }
}

