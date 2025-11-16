import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    // Support for proxies (X-Forwarded-For, X-Real-IP)
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
