import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto.js';
import { GetSignedUrlQueryDto } from './dto/get-signed-url-query.dto.js';
import { StorageService } from './storage.service.js';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_GERAL', 'OPERADOR')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('uploads')
  @ApiOperation({ summary: 'Gera URL assinada para upload de arquivo' })
  async createUpload(@Body() dto: CreateUploadRequestDto) {
    return this.storageService.createUploadRequest(dto);
  }

  @Get('signed-url')
  @ApiOperation({
    summary: 'Gera URL assinada temporária para download de arquivo',
  })
  @ApiQuery({ name: 'objectKey', required: true })
  @ApiQuery({ name: 'downloadName', required: false })
  @ApiQuery({ name: 'expiresInSeconds', required: false, type: Number })
  async getSignedUrl(@Query() query: GetSignedUrlQueryDto) {
    return this.storageService.getSignedDownloadUrl(query);
  }
}
