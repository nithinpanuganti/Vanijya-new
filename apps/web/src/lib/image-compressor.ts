/**
 * Image compression utility for Vanijya Registration Profile Photos
 * Requirements:
 * - Max dimensions: 600x600 px preserving aspect ratio
 * - Format: image/jpeg
 * - Initial Quality: 0.75
 * - Target Maximum Size: 300 KB (falls back to lower quality if needed)
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  width: number;
  height: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses an image File or Blob to max 600x600 JPEG <= 300KB
 */
export async function compressImage(
  source: File | Blob | string,
  fileName: string = 'profile-photo.jpg',
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    let originalSizeBytes = 0;
    let imageSrc = '';

    if (source instanceof File || source instanceof Blob) {
      originalSizeBytes = source.size;
      imageSrc = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      imageSrc = source;
      // Estimate base64 byte length
      originalSizeBytes = Math.round((source.length * 3) / 4);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context not supported.');
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to satisfy <= 300 KB limit
        let quality = 0.75;
        const tryExport = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image canvas to blob conversion failed.'));
                return;
              }

              const TARGET_MAX_BYTES = 300 * 1024; // 300 KB
              if (blob.size > TARGET_MAX_BYTES && quality > 0.4) {
                quality -= 0.15;
                tryExport();
                return;
              }

              const compressedFile = new File([blob], fileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              const previewUrl = URL.createObjectURL(blob);

              resolve({
                file: compressedFile,
                previewUrl,
                originalSizeBytes: originalSizeBytes || blob.size,
                compressedSizeBytes: blob.size,
                originalSizeFormatted: formatFileSize(originalSizeBytes || blob.size),
                compressedSizeFormatted: formatFileSize(blob.size),
                width,
                height,
              });
            },
            'image/jpeg',
            quality,
          );
        };

        tryExport();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression.'));
    };

    img.src = imageSrc;
  });
}
