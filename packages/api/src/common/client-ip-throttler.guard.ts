import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerRequest } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { getRateLimitTrackers } from './client-ip';

/**
 * ThrottlerGuard keyed on the visitor instead of the TCP peer.
 *
 * The stock guard tracks `request.ip`, which on Fly is the proxy for every
 * request: all visitors shared one bucket, so a single client could exhaust
 * the limits (login included) for everyone. Each request now counts against
 * every tracker from getRateLimitTrackers and is rejected as soon as one of
 * them is over the limit.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const req = props.context.switchToHttp().getRequest<FastifyRequest>();
    for (const tracker of getRateLimitTrackers(req)) {
      await super.handleRequest({ ...props, getTracker: () => tracker });
    }
    return true;
  }
}
