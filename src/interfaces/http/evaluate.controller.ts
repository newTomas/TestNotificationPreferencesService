import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EvaluateNotificationUseCase } from '../../application/use-cases/evaluate-notification.use-case';
import { notificationType } from '../../domain/types';
import { EvaluateDto } from './dto/evaluate.dto';

@Controller('evaluate')
export class EvaluateController {
  constructor(private readonly evaluateNotification: EvaluateNotificationUseCase) {}

  @Post()
  @HttpCode(200)
  evaluate(@Body() dto: EvaluateDto) {
    return this.evaluateNotification.execute({
      userId: dto.userId,
      notificationType: notificationType(dto.notificationType),
      channel: dto.channel,
      region: dto.region,
      datetime: dto.datetime,
    });
  }
}
