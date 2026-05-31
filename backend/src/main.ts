import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    // React Native has no Origin header; allow configured web origins + non-browser clients.
    origin: corsOrigins?.length
      ? (origin, callback) => {
          if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }
      : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public', 'news'), {
    prefix: '/news',
  });
  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads',
  });

  const config = new DocumentBuilder()
    .setTitle('Municipal Incident Platform API')
    .setDescription('GIS dispatch & incident management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`API running on http://localhost:${port} (bind ${host}, use LAN IP for mobile devices)`);
}

bootstrap();
