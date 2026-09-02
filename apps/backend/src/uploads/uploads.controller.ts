import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Uploads & Media')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('profile-photo')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a profile photo (base64 or multipart)' })
  @ApiResponse({ status: 201, description: 'Photo successfully uploaded and stored' })
  @ApiResponse({ status: 400, description: 'Invalid photo format or size exceeded' })
  async uploadPhotoBase64(@Body('photo') photo: string) {
    if (!photo) {
      throw new BadRequestException('Photo payload is required.');
    }
    return this.uploadsService.saveBase64Image(photo);
  }

  @Post('profile-photo/file')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a profile photo using multipart/form-data' })
  async uploadPhotoFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    return this.uploadsService.saveFile(file);
  }

  @Get('profile-photos/:filename')
  @ApiOperation({ summary: 'Serve a stored profile photo' })
  getPhoto(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.uploadsService.getFilePath(filename);
    if (!filePath) {
      // Fallback SVG avatar placeholder if image file not on disk
      const svgAvatar = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#fef3c7"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="64" fill="#92400e" font-weight="bold">
            VJ
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svgAvatar.trim());
    }
    return res.sendFile(filePath);
  }
}
