import { ConfigService } from '@nestjs/config';

export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  if (isProd && !secret) {
    throw new Error(
      'JWT_SECRET environment variable is required in production',
    );
  }

  return secret || 'dev-only-secret-change-in-production';
}

export function getCorsOrigins(): boolean | string[] {
  const isProd = process.env.NODE_ENV === 'production';
  const clientUrl = process.env.CLIENT_URL?.trim();

  if (isProd && clientUrl) {
    return [clientUrl.replace(/\/$/, '')];
  }

  if (isProd && process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map((o) => o.trim());
  }

  return true;
}

export function isProduction(config: ConfigService): boolean {
  return config.get<string>('NODE_ENV') === 'production';
}
