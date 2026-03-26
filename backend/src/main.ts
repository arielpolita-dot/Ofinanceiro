import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('Bootstrap');

  // API prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', 'api/docs'],
  });

  app.use(cookieParser());

  app.use(
    helmet({
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      noSniff: true,
      frameguard: { action: 'deny' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'", 'https:'],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      dnsPrefetchControl: { allow: false },
      ieNoOpen: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [];

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:8001', 'http://localhost:5173');
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow server-to-server requests (no Origin header): health checks, internal APIs, curl
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  const port = process.env.PORT || 8000;

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('App Template API')
      .setDescription('App Template - API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', description: 'Enter JWT token', in: 'header' },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Admin', 'Admin dashboard')
      .addTag('Health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on port ${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
