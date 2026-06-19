import { z } from 'zod';

export const channelSchema = z.enum(['email', 'sms', 'push', 'messenger']);
export const regionSchema = z.enum(['EU', 'US', 'UK', 'APAC', 'OTHER']);
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Формат времени — HH:mm');
