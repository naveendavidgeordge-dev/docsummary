import { Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document' })
  async upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.documentsService.uploadDocument(file, user.id);
  }

  @Get()
  @ApiOperation({ summary: "List user's documents" })
  async list(@CurrentUser() user: any) {
    return this.documentsService.listDocuments(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.documentsService.getDocument(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.documentsService.deleteDocument(id, user.id);
  }
}
