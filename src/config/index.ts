import { LoadStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IConfig } from '../types/config.interface';

export function config(): IConfig {
  const publicKey = readFileSync(
    join(__dirname, '..', '..', 'keys/id_rsa.pub'),
    'utf-8',
  );
  const privateKey = readFileSync(
    join(__dirname, '..', '..', 'keys/id_rsa'),
    'utf-8',
  );

  const config: IConfig & { APP_ID: string } = {
    id: process.env.APP_ID,
    APP_ID: process.env.APP_ID,
    port: parseInt(process.env.PORT, 10),
    domain: process.env.DOMAIN,
    jwt: {
      access: {
        privateKey,
        publicKey,
        time: parseInt(process.env.JWT_ACCESS_TIME, 10),
      },
      confirmation: {
        secret: process.env.JWT_CONFIRMATION_SECRET,
        time: parseInt(process.env.JWT_CONFIRMATION_TIME, 10),
      },
      resetPassword: {
        secret: process.env.JWT_RESET_PASSWORD_SECRET,
        time: parseInt(process.env.JWT_RESET_PASSWORD_TIME, 10),
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET,
        time: parseInt(process.env.JWT_REFRESH_TIME, 10),
      },
    },
    emailService: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
    db: defineConfig({
      clientUrl: 'everflame',
      dbName: 'database/everflame.sqlite',
      entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
      entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
      loadStrategy: LoadStrategy.JOINED,
      allowGlobalContext: true,
    }),
  };

  console.dir(config)

  return config;
}
