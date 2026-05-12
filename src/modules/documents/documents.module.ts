import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentRepository } from './repositories/document.repository';
import { BlobStorageService } from './services/blob-storage.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentRepository, BlobStorageService],
})
export class DocumentsModule {}
