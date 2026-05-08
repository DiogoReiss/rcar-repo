import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@SkipThrottle() // Q14: health checks must not be rate-limited (load balancer probes)
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check for load balancers and monitoring' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
