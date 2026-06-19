import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { GetEffectivePreferencesUseCase } from '../../application/use-cases/get-effective-preferences.use-case';
import {
  UpdatePreferencesUseCase,
  type UpdatePreferencesCommand,
} from '../../application/use-cases/update-preferences.use-case';
import { makeQuietHours } from '../../domain/quiet-hours';
import { notificationType } from '../../domain/types';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

const toCommand = (dto: UpdatePreferencesDto): UpdatePreferencesCommand => ({
  ...(dto.toggles
    ? {
        toggles: dto.toggles.map((toggle) => ({
          notificationType: notificationType(toggle.notificationType),
          channel: toggle.channel,
          enabled: toggle.enabled,
        })),
      }
    : {}),
  ...(dto.quietHours !== undefined
    ? {
        quietHours: dto.quietHours
          ? makeQuietHours(dto.quietHours.start, dto.quietHours.end, dto.quietHours.timezone)
          : null,
      }
    : {}),
});

@Controller('users/:id/preferences')
export class PreferencesController {
  constructor(
    private readonly getPreferences: GetEffectivePreferencesUseCase,
    private readonly updatePreferences: UpdatePreferencesUseCase,
  ) {}

  @Get()
  get(@Param('id') id: string) {
    return this.getPreferences.execute(id);
  }

  @Post()
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() dto: UpdatePreferencesDto) {
    await this.updatePreferences.execute(id, toCommand(dto));
    return this.getPreferences.execute(id);
  }
}
