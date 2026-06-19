import { z } from 'zod';
import { TIME_PATTERN } from '../../../domain/quiet-hours';
import { CHANNELS, REGIONS } from '../../../domain/types';

export const channelSchema = z.enum(CHANNELS);
export const regionSchema = z.enum(REGIONS);
export const timeSchema = z.string().regex(TIME_PATTERN, 'Формат времени — HH:mm');
