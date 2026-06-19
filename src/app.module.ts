import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ApplicationModule } from './application/application.module';
import { validateEnv } from './infrastructure/config/env.schema';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HttpModule } from './interfaces/http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.getOrThrow<string>('LOG_LEVEL'),
          genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
          ...(config.getOrThrow<string>('NODE_ENV') === 'development'
            ? { transport: { target: 'pino-pretty' } }
            : {}),
        },
      }),
    }),
    InfrastructureModule,
    ApplicationModule,
    HttpModule,
  ],
})
export class AppModule {}
