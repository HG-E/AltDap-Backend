import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`AltDap API listening on http://localhost:${port}`);
}

bootstrap();
