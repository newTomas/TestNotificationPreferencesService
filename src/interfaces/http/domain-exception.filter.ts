import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { DomainError, UnknownNotificationTypeError } from '../../domain/errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status =
      error instanceof UnknownNotificationTypeError ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
    reply.status(status).send({ error: error.constructor.name, message: error.message });
  }
}
