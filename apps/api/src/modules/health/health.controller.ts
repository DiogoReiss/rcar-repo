import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check for load balancers and monitoring' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

