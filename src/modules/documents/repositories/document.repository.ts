import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Document, Prisma } from '@prisma/client';

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  async findAll(userId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id, userId },
    });
  }

  async delete(id: string, userId: string): Promise<Document> {
    return this.prisma.document.delete({
      where: { id, userId },
    });
  }

  async updateStatus(id: string, status: any, extractedJson?: any, errorMessage?: string): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: {
        status,
        extractedJson,
        errorMessage,
        processedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });
  }
}
