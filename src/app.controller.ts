import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API root status' })
  getRoot() {
    return {
      name: 'DocProcess API',
      status: 'ok',
      version: '1.0',
      basePath: '/api/v1',
      docs: '/api/v1/docs',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}
