import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ApplicationModule } from '../../application/application.module';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { EvaluateController } from './evaluate.controller';
import { HealthController } from './health.controller';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { PreferencesController } from './preferences.controller';

@Module({
  imports: [ApplicationModule, InfrastructureModule, TerminusModule],
  controllers: [PreferencesController, EvaluateController, HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor }],
})
export class HttpModule {}
