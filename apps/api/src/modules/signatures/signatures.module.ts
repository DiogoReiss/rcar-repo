import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { SignaturesController } from './signatures.controller.js';
import { SignatureWebhookController } from './signature-webhook.controller.js';
import { SignaturesService } from './signatures.service.js';
import { SIGNATURE_PROVIDER } from './signature-provider.js';
import { FakeSignatureProvider } from './fake-signature.provider.js';

@Module({
  imports: [DocumentsModule, StorageModule],
  controllers: [SignaturesController, SignatureWebhookController],
  providers: [
    SignaturesService,
    { provide: SIGNATURE_PROVIDER, useClass: FakeSignatureProvider },
  ],
  exports: [SignaturesService, SIGNATURE_PROVIDER],
})
export class SignaturesModule {}
