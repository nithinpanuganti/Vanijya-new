import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads', 'profile-photos');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validates and saves an uploaded binary file to local server storage
   */
  async saveFile(file: any): Promise<{ url: string; filename: string; path: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Profile photo file is required.');
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    const mimeType = (file.mimetype || '').toLowerCase();
    if (!allowedMime.includes(mimeType)) {
      throw new BadRequestException('Invalid image format. Only JPG, PNG, and WebP are allowed.');
    }

    // Max 5 MB limit
    if (file.size > 5 * 1024 * 1024 || file.buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Profile photo exceeds the 5 MB size limit.');
    }

    let ext = '.jpg';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';

    const filename = `photo-${Date.now()}-${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: `/api/uploads/profile-photos/${filename}`,
      filename,
      path: filePath,
    };
  }

  /**
   * Validates MIME type and size from buffer / base64 string and writes to disk
   */
  async saveBase64Image(dataUrlOrBase64: string): Promise<{ url: string; filename: string; path: string }> {
    if (!dataUrlOrBase64) {
      throw new BadRequestException('Profile photo is required.');
    }

    let mimeType = 'image/jpeg';
    let base64Data = dataUrlOrBase64;

    if (dataUrlOrBase64.includes(';base64,')) {
      const parts = dataUrlOrBase64.split(';base64,');
      const mimeMatch = parts[0].match(/data:(image\/(jpeg|png|webp))/i);
      if (!mimeMatch) {
        throw new BadRequestException('Invalid image format. Only JPG, PNG, and WebP are allowed.');
      }
      mimeType = mimeMatch[1].toLowerCase();
      base64Data = parts[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Max 5 MB check
    if (buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Profile photo exceeds the 5 MB size limit.');
    }

    let ext = '.jpg';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';

    const filename = `photo-${Date.now()}-${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `/api/uploads/profile-photos/${filename}`,
      filename,
      path: filePath,
    };
  }

  /**
   * Deletes a stored file from disk (used for rollback/cleanup if DB creation fails)
   */
  async deleteFile(filenameOrUrl: string): Promise<void> {
    if (!filenameOrUrl) return;
    try {
      const filename = path.basename(filenameOrUrl);
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch {
      // Ignore deletion failure
    }
  }

  getFilePath(filename: string): string | null {
    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
}
