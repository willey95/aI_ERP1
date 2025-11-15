import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');

  // Security: Helmet middleware
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS with security
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600, // 1 hour
  });

  // Global validation pipe with detailed errors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 422,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger API Documentation (only in non-production)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('XEM System API')
      .setDescription('eXecution & Expenditure Management System API Documentation')
      .setVersion('3.1.0')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Projects', 'Project management endpoints')
      .addTag('Budget', 'Budget management endpoints')
      .addTag('Execution', 'Execution request endpoints')
      .addTag('Approval', 'Approval workflow endpoints')
      .addTag('Financial', 'Financial modeling endpoints')
      .addTag('Simulation', 'Scenario simulation endpoints')
      .addTag('Dashboard', 'Dashboard and analytics endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Health', 'Health check endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'XEM API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`🚀 XEM Backend running on http://localhost:${port}/api`);
  logger.log(`📝 Environment: ${nodeEnv}`);
  logger.log(`🔐 CORS enabled for: ${corsOrigin}`);
}
bootstrap();
