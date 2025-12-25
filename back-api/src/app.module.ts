import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  AuthGuard,
  ResourceGuard,
  RoleGuard,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReservationModule } from './reservation/presentation/reservation.module';
import { AnnonceModule } from './annonce/presentation/annonce.module';
import { EvenementModule } from './evenement/presentation/evenement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        authServerUrl: configService.get<string>('KEYCLOAK_URL') || 'https://gul-si.fr/',
        realm: configService.get<string>('KEYCLOAK_REALM') || 'gsi-booking',
        clientId: configService.get<string>('KEYCLOAK_CLIENT_ID') || 'app-admin',
        secret: configService.get<string>('KEYCLOAK_SECRET'), // Optionnel pour les clients publics
        policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
        tokenValidation: TokenValidation.ONLINE,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ReservationModule,
    AnnonceModule,
    EvenementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
