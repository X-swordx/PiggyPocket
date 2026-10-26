import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  @ApiOperation({ summary: '存活探针：进程能响应即视为存活' })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: '就绪探针：数据库可查询才接收流量' })
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        checks: { database: 'up' },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        message: 'Database is not ready',
        checks: { database: 'down' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
