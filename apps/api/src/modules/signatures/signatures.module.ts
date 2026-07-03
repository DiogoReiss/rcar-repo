import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import { SignaturesController } from './signatures.controller.js';
import { SignaturesService } from './signatures.service.js';
import { SIGNATURE_PROVIDER } from './signature-provider.js';
import { FakeSignatureProvider } from './fake-signature.provider.js';

@Module({
  imports: [DocumentsModule],
  controllers: [SignaturesController],
  providers: [
    SignaturesService,
    { provide: SIGNATURE_PROVIDER, useClass: FakeSignatureProvider },
  ],
  exports: [SignaturesService, SIGNATURE_PROVIDER],
})
export class SignaturesModule {}
