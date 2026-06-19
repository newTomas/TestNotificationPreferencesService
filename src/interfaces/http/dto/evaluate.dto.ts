import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { channelSchema, regionSchema } from './common';

const schema = z.object({
  userId: z.string().min(1),
  notificationType: z.string().min(1),
  channel: channelSchema,
  region: regionSchema,
  datetime: z.iso.datetime(),
});

export class EvaluateDto extends createZodDto(schema) {}
