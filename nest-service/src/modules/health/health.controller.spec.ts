import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const dataSource = {
    query: jest.fn(),
  } as unknown as DataSource;

  const controller = new HealthController(dataSource);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('live 返回 ok', () => {
    expect(controller.live()).toMatchObject({ status: 'ok' });
  });

  it('ready 在数据库可查询时返回 ok', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([{ '1': 1 }]);

    await expect(controller.ready()).resolves.toMatchObject({
      status: 'ok',
      checks: { database: 'up' },
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('ready 在数据库不可用时返回 503', async () => {
    (dataSource.query as jest.Mock).mockRejectedValue(new Error('db down'));

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
