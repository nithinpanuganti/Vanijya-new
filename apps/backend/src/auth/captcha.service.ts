import { Injectable, Logger, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

export interface CaptchaChallenge {
  id: string;
  hashedAnswer: string;
  salt: string;
  createdAt: number;
  expiresAt: number;
  failedAttempts: number;
  used: boolean;
}

export interface CaptchaResponse {
  captchaId: string;
  image: string;
  expiresIn: number;
}

interface CaptchaRateLimitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class CaptchaService implements OnModuleDestroy {
  private readonly logger = new Logger(CaptchaService.name);

  // Character set excluding visually ambiguous characters (0, O, 1, I, L, 5, S, 8, B)
  private readonly CHARSET = 'ACDEFGHJKMNPQRTUVWXYZ234679';
  private readonly CAPTCHA_LENGTH = 5;
  private readonly CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_FAILED_ATTEMPTS = 5;

  private challenges = new Map<string, CaptchaChallenge>();
  private rateLimits = new Map<string, CaptchaRateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 2 minutes to keep in-memory store lightweight
    this.cleanupInterval = setInterval(() => this.cleanupExpiredChallenges(), 2 * 60 * 1000);
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Rate limit CAPTCHA generation per client IP (max 30 requests / min).
   */
  private checkRateLimit(key: string) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 30;

    const record = this.rateLimits.get(key);
    if (!record || now > record.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (record.count >= maxRequests) {
      throw new HttpException(
        'Too many CAPTCHA requests. Please wait a moment before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
  }

  /**
   * Determine if CAPTCHA verification is required.
   * In production (NODE_ENV=production), CAPTCHA is strictly enforced.
   * In dev/demo (CAPTCHA_ENABLED=false with DEMO_MODE=true or NODE_ENV!=production), bypass is permitted.
   */
  isCaptchaEnabled(): boolean {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return true; // Never allow bypass in production
    }

    const captchaEnabledEnv = process.env.CAPTCHA_ENABLED;
    if (captchaEnabledEnv === 'false' || captchaEnabledEnv === '0') {
      const isDemoMode = process.env.DEMO_MODE === 'true';
      const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'test';
      if (isDemoMode || isDev) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a randomized uppercase + number string using cryptographically secure random values.
   */
  private generateRandomCode(): string {
    let result = '';
    const charsetLength = this.CHARSET.length;
    for (let i = 0; i < this.CAPTCHA_LENGTH; i++) {
      const randomIndex = crypto.randomInt(0, charsetLength);
      result += this.CHARSET[randomIndex];
    }
    return result;
  }

  /**
   * Hash the answer with a unique per-challenge salt using SHA-256.
   */
  private hashAnswer(answer: string, salt: string): string {
    return crypto
      .createHash('sha256')
      .update(answer.trim().toUpperCase() + salt)
      .digest('hex');
  }

  /**
   * Render distorted visual CAPTCHA as an SVG base64 image.
   */
  private generateCaptchaSvg(text: string): string {
    const width = 220;
    const height = 60;

    // Distinct dark color palette for high contrast on light background
    const textColors = ['#0f172a', '#1e293b', '#78350f', '#064e3b', '#1e1b4b', '#713f12', '#022c22'];
    const lineColors = ['#f59e0b', '#d97706', '#94a3b8', '#cbd5e1', '#fbbf24', '#fcd34d'];

    // 1. Interference Bezier lines
    let linesSvg = '';
    for (let i = 0; i < 4; i++) {
      const x1 = crypto.randomInt(0, 30);
      const y1 = crypto.randomInt(10, height - 10);
      const x2 = crypto.randomInt(width - 40, width);
      const y2 = crypto.randomInt(10, height - 10);
      const cx1 = crypto.randomInt(40, width / 2);
      const cy1 = crypto.randomInt(5, height - 5);
      const cx2 = crypto.randomInt(width / 2, width - 40);
      const cy2 = crypto.randomInt(5, height - 5);
      const stroke = lineColors[i % lineColors.length];
      const strokeWidth = (crypto.randomInt(15, 25) / 10).toFixed(1);
      linesSvg += `<path d="M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" opacity="0.75" />`;
    }

    // 2. Random Noise Dots
    let dotsSvg = '';
    for (let i = 0; i < 30; i++) {
      const cx = crypto.randomInt(5, width - 5);
      const cy = crypto.randomInt(5, height - 5);
      const r = (crypto.randomInt(8, 22) / 10).toFixed(1);
      const dotColor = lineColors[i % lineColors.length];
      dotsSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dotColor}" opacity="0.6" />`;
    }

    // 3. Characters with individual rotation, offset, and styling
    let charactersSvg = '';
    const charSpacing = (width - 40) / text.length;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = 24 + i * charSpacing + crypto.randomInt(-2, 3);
      const y = crypto.randomInt(38, 45);
      const rotate = crypto.randomInt(-22, 23);
      const fontSize = crypto.randomInt(28, 34);
      const color = textColors[crypto.randomInt(0, textColors.length)];

      charactersSvg += `
        <text 
          x="${x}" 
          y="${y}" 
          font-family="'Courier New', Courier, monospace, sans-serif" 
          font-size="${fontSize}px" 
          font-weight="900" 
          letter-spacing="2px"
          fill="${color}" 
          transform="rotate(${rotate}, ${x}, ${y})"
          style="user-select: none; -webkit-user-select: none;"
        >${char}</text>
      `;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="50%" stop-color="#fef3c7" />
            <stop offset="100%" stop-color="#fef9c3" />
          </linearGradient>
          <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#fef08a" stroke-width="0.8" opacity="0.7"/>
          </pattern>
        </defs>
        <rect width="${width}" height="${height}" rx="12" fill="url(#bgGrad)" stroke="#fde68a" stroke-width="1.5" />
        <rect width="${width}" height="${height}" rx="12" fill="url(#grid)" />
        ${linesSvg}
        ${dotsSvg}
        ${charactersSvg}
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Generate a new server-side CAPTCHA challenge with optional IP rate limiting.
   */
  generateCaptcha(ip?: string): CaptchaResponse {
    if (ip) {
      this.checkRateLimit(ip);
    }
    const code = this.generateRandomCode();
    const captchaId = `cpt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedAnswer = this.hashAnswer(code, salt);
    const now = Date.now();

    const challenge: CaptchaChallenge = {
      id: captchaId,
      hashedAnswer,
      salt,
      createdAt: now,
      expiresAt: now + this.CAPTCHA_TTL_MS,
      failedAttempts: 0,
      used: false,
    };

    this.challenges.set(captchaId, challenge);

    const image = this.generateCaptchaSvg(code);

    return {
      captchaId,
      image,
      expiresIn: Math.floor(this.CAPTCHA_TTL_MS / 1000), // 300 seconds
    };
  }

  /**
   * Verify user's CAPTCHA input against the stored challenge.
   */
  verifyCaptcha(captchaId?: string, answer?: string): { success: boolean; error?: string } {
    if (!this.isCaptchaEnabled()) {
      return { success: true };
    }

    if (!captchaId || !answer || answer.trim() === '') {
      return {
        success: false,
        error: 'Please enter the CAPTCHA.',
      };
    }

    const challenge = this.challenges.get(captchaId);
    const now = Date.now();

    if (!challenge) {
      return {
        success: false,
        error: 'CAPTCHA expired. Please refresh and try again.',
      };
    }

    if (challenge.used) {
      this.challenges.delete(captchaId);
      return {
        success: false,
        error: 'CAPTCHA has already been used. Please refresh and try again.',
      };
    }

    if (now > challenge.expiresAt) {
      this.challenges.delete(captchaId);
      return {
        success: false,
        error: 'CAPTCHA expired. Please refresh and try again.',
      };
    }

    if (challenge.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      this.challenges.delete(captchaId);
      return {
        success: false,
        error: 'Too many incorrect attempts. Please generate a new CAPTCHA.',
      };
    }

    const hashedAttempt = this.hashAnswer(answer, challenge.salt);

    if (hashedAttempt !== challenge.hashedAnswer) {
      challenge.failedAttempts += 1;

      if (challenge.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        this.challenges.delete(captchaId);
        return {
          success: false,
          error: 'Too many incorrect attempts. Please generate a new CAPTCHA.',
        };
      }

      return {
        success: false,
        error: 'Incorrect CAPTCHA. Please try again.',
      };
    }

    // Mark single-use and remove from storage
    challenge.used = true;
    this.challenges.delete(captchaId);

    return { success: true };
  }

  /**
   * Clean up expired challenges from the in-memory store.
   */
  cleanupExpiredChallenges(): number {
    const now = Date.now();
    let count = 0;
    for (const [id, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt || challenge.used) {
        this.challenges.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * For testing: get current stored challenge count.
   */
  getChallengeCount(): number {
    return this.challenges.size;
  }
}
