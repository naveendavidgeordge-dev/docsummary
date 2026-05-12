import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentRepository } from './repositories/document.repository';
import { BlobStorageService } from './services/blob-storage.service';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly blobStorageService: BlobStorageService,
  ) {}

  async uploadDocument(file: Express.Multer.File, userId: string) {
    // Basic validation
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Upload to Azure Blob
    const { url, path, fileName } = await this.blobStorageService.uploadFile(file);

    // Save metadata to DB
    return this.documentRepository.create({
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      blobUrl: url,
      blobPath: path,
      status: DocumentStatus.PENDING,
      user: { connect: { id: userId } },
    });
  }

  async listDocuments(userId: string) {
    return this.documentRepository.findAll(userId);
  }

  async getDocument(id: string, userId: string) {
    const document = await this.documentRepository.findById(id, userId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async deleteDocument(id: string, userId: string) {
    const document = await this.documentRepository.findById(id, userId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from Blob Storage
    await this.blobStorageService.deleteBlob(document.blobPath);

    // Delete from DB
    return this.documentRepository.delete(id, userId);
  }
}
