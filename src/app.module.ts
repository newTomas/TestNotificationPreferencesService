import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationModule } from './application/application.module';
import { validateEnv } from './infrastructure/config/env.schema';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HttpModule } from './interfaces/http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    InfrastructureModule,
    ApplicationModule,
    HttpModule,
  ],
})
export class AppModule {}
