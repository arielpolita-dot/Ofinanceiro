import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    // Verifica conexao com o banco de dados
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
