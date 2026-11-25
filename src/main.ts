import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      '*',
    ],
    methods: ["GET", "POST"],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app))
  await app.listen(app.get(ConfigService).get<number>('port') ?? 3000);
}
bootstrap();
