import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  ContainerClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlobStorageService implements OnModuleInit {
  private readonly containerClient: ContainerClient;
  private readonly logger = new Logger(BlobStorageService.name);
  private sharedKeyCredential: StorageSharedKeyCredential | null = null;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('app.azureStorageConnectionString');
    const containerName = this.configService.get<string>('app.azureStorageContainerName');

    if (connectionString && connectionString !== 'your_connection_string') {
      try {
        // Parse credentials for SAS generation
        const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
        const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
        if (accountNameMatch && accountKeyMatch) {
          this.sharedKeyCredential = new StorageSharedKeyCredential(
            accountNameMatch[1],
            accountKeyMatch[1],
          );
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = blobServiceClient.getContainerClient(containerName as string);
        this.logger.log('BlobServiceClient initialized successfully');
      } catch (error) {
        this.logger.error(`Failed to initialize BlobServiceClient: ${(error as any).message}`);
      }
    } else {
      this.logger.warn('AZURE_STORAGE_CONNECTION_STRING is not set. Blob storage operations will fail.');
    }
  }

  async onModuleInit() {
    if (this.containerClient) {
      try {
        const exists = await this.containerClient.exists();
        if (!exists) {
          this.logger.log(`Creating private container: ${this.containerClient.containerName}`);
          // Create as private — SAS URLs are used for access (no public access needed)
          await this.containerClient.create();
          this.logger.log('Container created successfully.');
        } else {
          this.logger.log('Container already exists.');
        }
      } catch (error) {
        this.logger.error(`Failed to ensure container exists: ${(error as any).message}`);
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; path: string; fileName: string }> {
    const date = new Date();
    const datePath = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    const fileId = uuidv4();
    const fileName = `${fileId}-${file.originalname}`;
    const blobPath = `${datePath}/${fileName}`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    // Generate a long-lived SAS URL (1 year) for document storage
    const sasUrl = this.generateSasUrl(blobPath, 8760);

    return {
      url: sasUrl,
      path: blobPath,
      fileName,
    };
  }

  generateSasUrl(blobPath: string, expiryHours = 8760): string {
    if (!this.sharedKeyCredential) {
      // Fallback: return plain URL (works if public access is enabled)
      return this.containerClient.getBlockBlobClient(blobPath).url;
    }

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + expiryHours);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerClient.containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
      },
      this.sharedKeyCredential,
    ).toString();

    return `${this.containerClient.getBlockBlobClient(blobPath).url}?${sasToken}`;
  }

  async deleteBlob(blobPath: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.deleteIfExists();
  }
}
