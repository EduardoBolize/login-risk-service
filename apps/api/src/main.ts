import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const openApi = new DocumentBuilder()
    .setTitle('Login Risk Service')
    .setDescription('Real-time risk scoring for login attempts')
    .setVersion('0.1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, openApi));

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
