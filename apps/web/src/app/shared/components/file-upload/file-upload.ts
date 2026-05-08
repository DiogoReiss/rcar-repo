import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { StorageService } from '@core/services/storage.service';

@Component({
  selector: 'lync-file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FileUploadComponent {
  private readonly storage = inject(StorageService);

  readonly folder = input('documents');
  readonly accept = input('*/*');
  readonly value = input<string | null>(null);
  readonly disabled = input(false);

  readonly valueChange = output<string | null>();

  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly uploadedFileName = signal<string | null>(null);

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    this.error.set(null);

    if (!file) return;

    this.uploading.set(true);
    try {
      const { objectKey, fileName } = await this.storage.uploadFile(file, this.folder());
      this.uploadedFileName.set(fileName);
      this.valueChange.emit(objectKey);
    } catch {
      this.error.set('Não foi possível enviar o arquivo. Tente novamente.');
    } finally {
      this.uploading.set(false);
      target.value = '';
    }
  }

  clear() {
    this.uploadedFileName.set(null);
    this.error.set(null);
    this.valueChange.emit(null);
  }
}

