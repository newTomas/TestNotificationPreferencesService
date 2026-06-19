import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { channelSchema, timeSchema } from './common';

const schema = z.object({
  toggles: z
    .array(
      z.object({
        notificationType: z.string().min(1),
        channel: channelSchema,
        enabled: z.boolean(),
      }),
    )
    .optional(),
  quietHours: z
    .object({ start: timeSchema, end: timeSchema, timezone: z.string().min(1) })
    .nullable()
    .optional(),
});

export class UpdatePreferencesDto extends createZodDto(schema) {}
