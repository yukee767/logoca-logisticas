import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check básico' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'logoca-nest',
      version: '1.0.0',
    };
  }

  @Public()
  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return { status: 'ready' };
  }
}
