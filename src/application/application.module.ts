import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { EvaluateNotificationUseCase } from './use-cases/evaluate-notification.use-case';
import { GetEffectivePreferencesUseCase } from './use-cases/get-effective-preferences.use-case';
import { UpdatePreferencesUseCase } from './use-cases/update-preferences.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [EvaluateNotificationUseCase, GetEffectivePreferencesUseCase, UpdatePreferencesUseCase],
  exports: [EvaluateNotificationUseCase, GetEffectivePreferencesUseCase, UpdatePreferencesUseCase],
})
export class ApplicationModule {}
