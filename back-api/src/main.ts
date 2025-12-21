import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const logLevels = process.env.LOG_LEVEL
    ? process.env.LOG_LEVEL.split(',').map((level) => level.trim())
    : ['error', 'warn', 'log', 'debug', 'verbose'];
  
  const validLogLevels = ['error', 'warn', 'log', 'debug', 'verbose'];
  const filteredLogLevels = logLevels.filter((level) =>
    validLogLevels.includes(level),
  );
  
  if (filteredLogLevels.length === 0) {
    logger.warn(
      'Aucun niveau de log valide trouvé, utilisation des niveaux par défaut',
    );
    filteredLogLevels.push(...['error', 'warn', 'log']);
  }
  
  logger.log(`Niveaux de log configurés: ${filteredLogLevels.join(', ')}`);
  
  const app = await NestFactory.create(AppModule, {
    logger: filteredLogLevels as any,
  });

  // Configuration du logging global
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configuration de la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuration Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Airbnb Reservation System API')
    .setDescription(
      'API de gestion des réservations et calendriers pour le système de réservation Airbnb',
    )
    .setVersion('1.0')
    .addTag('reservations', 'Gestion des réservations')
    .addTag('calendar-urls', 'Gestion des URLs de calendrier')
    .addTag('airbnb', 'Intégration avec les calendriers Airbnb')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Airbnb Reservation API',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);
  if (filteredLogLevels.includes('debug')) {
    logger.debug('Debug logging enabled');
  }
  if (filteredLogLevels.includes('verbose')) {
    logger.verbose('Verbose logging enabled');
  }
}
bootstrap();
