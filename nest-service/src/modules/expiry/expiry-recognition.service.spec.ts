import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExpiryRecognitionService } from './expiry-recognition.service';

const imageResponse = (
  body = 'fake-image',
  contentType = 'image/jpeg',
  contentLength = body.length,
) => ({
  ok: true,
  headers: {
    get: (key: string) =>
      key === 'content-type'
        ? contentType
        : key === 'content-length'
          ? String(contentLength)
          : null,
  },
  arrayBuffer: async () => Buffer.from(body),
});

const createService = (model: unknown, owned = true) => {
  const ossService = {
    isOwnedUrl: jest.fn().mockReturnValue(owned),
    signUrl: jest.fn((url: string) => `${url}?OSSAccessKeyId=id&Expires=1&Signature=sig`),
  };
  return {
    service: new ExpiryRecognitionService(model as never, ossService as never),
    ossService,
  };
};

describe('ExpiryRecognitionService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('模型未配置时返回 503', async () => {
    const { service } = createService(null);
    await expect(
      service.recognize(['https://bucket.oss.example.com/items/a.jpg']),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('图片不属于本站 OSS 时拒绝，且不发起抓取', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as never;
    const model = { invoke: jest.fn() };
    const { service } = createService(model, false);

    await expect(
      service.recognize(['https://evil.example.com/a.jpg']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('非图片响应返回 400', async () => {
    global.fetch = jest.fn().mockResolvedValue(imageResponse('', 'text/html')) as never;
    const model = { invoke: jest.fn() };
    const { service } = createService(model);

    await expect(
      service.recognize(['https://bucket.oss.example.com/items/a.jpg']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(model.invoke).not.toHaveBeenCalled();
  });

  it('超过 8MB 的图片返回 400', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(imageResponse('small', 'image/jpeg', 8 * 1024 * 1024 + 1)) as never;
    const model = { invoke: jest.fn() };
    const { service } = createService(model);

    await expect(
      service.recognize(['https://bucket.oss.example.com/items/a.jpg']),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('模型调用失败时返回 502', async () => {
    global.fetch = jest.fn().mockResolvedValue(imageResponse()) as never;
    const model = { invoke: jest.fn().mockRejectedValue(new Error('timeout')) };
    const { service } = createService(model);

    await expect(
      service.recognize(['https://bucket.oss.example.com/items/a.jpg']),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('模型返回非法 JSON 时按未识别处理，不抛 500', async () => {
    global.fetch = jest.fn().mockResolvedValue(imageResponse()) as never;
    const model = { invoke: jest.fn().mockResolvedValue({ content: '不是 JSON' }) };
    const { service } = createService(model);

    const result = await service.recognize([
      'https://bucket.oss.example.com/items/a.jpg',
    ]);

    expect(result.recognized).toBe(false);
    expect(result.warnings).toEqual(['未识别到可用的商品信息，请手动填写']);
  });

  it('请求体里的签名被中间件剥掉后，服务端重新签名再抓取', async () => {
    const fetchMock = jest.fn().mockResolvedValue(imageResponse());
    global.fetch = fetchMock as never;
    const model = { invoke: jest.fn().mockResolvedValue({ content: '{}' }) };
    const { service, ossService } = createService(model);

    await service.recognize(['https://bucket.oss.example.com/items/a.jpg']);

    expect(ossService.signUrl).toHaveBeenCalledWith(
      'https://bucket.oss.example.com/items/a.jpg',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://bucket.oss.example.com/items/a.jpg?OSSAccessKeyId=id&Expires=1&Signature=sig',
      expect.anything(),
    );
  });

  it('两张图片都下载并按顺序交给模型', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(imageResponse('front'))
      .mockResolvedValueOnce(imageResponse('back'));
    global.fetch = fetchMock as never;
    const model = { invoke: jest.fn().mockResolvedValue({ content: '{}' }) };
    const { service } = createService(model);

    await service.recognize([
      'https://bucket.oss.example.com/items/front.jpg',
      'https://bucket.oss.example.com/items/back.jpg',
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const parts = (
      model.invoke.mock.calls[0][0] as Array<{
        content: Array<{ type: string; image_url?: { url: string } }>;
      }>
    )[1].content.filter((part) => part.type === 'image_url');
    expect(parts.map((part) => part.image_url?.url)).toEqual([
      `data:image/jpeg;base64,${Buffer.from('front').toString('base64')}`,
      `data:image/jpeg;base64,${Buffer.from('back').toString('base64')}`,
    ]);
  });

  it('任意一张图片不属于本站 OSS 时拒绝，且不发起抓取', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as never;
    const model = { invoke: jest.fn() };
    const { service, ossService } = createService(model);
    ossService.isOwnedUrl.mockImplementation(
      (url: string) => !url.includes('evil'),
    );

    await expect(
      service.recognize([
        'https://bucket.oss.example.com/items/a.jpg',
        'https://evil.example.com/b.jpg',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('图片数量不在 1～2 张时返回 400，且不发起抓取', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as never;
    const model = { invoke: jest.fn() };
    const { service } = createService(model);

    await expect(service.recognize([])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.recognize([
        'https://bucket.oss.example.com/items/a.jpg',
        'https://bucket.oss.example.com/items/b.jpg',
        'https://bucket.oss.example.com/items/c.jpg',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('两张图片合计超过 12MB 时返回 400', async () => {
    const big = 'a'.repeat(7 * 1024 * 1024);
    global.fetch = jest.fn().mockResolvedValue(imageResponse(big)) as never;
    const model = { invoke: jest.fn() };
    const { service } = createService(model);

    await expect(
      service.recognize([
        'https://bucket.oss.example.com/items/a.jpg',
        'https://bucket.oss.example.com/items/b.jpg',
      ]),
    ).rejects.toThrow('图片总大小不能超过 12MB');
    expect(model.invoke).not.toHaveBeenCalled();
  });

  it('把图片转成 data URL 交给模型，并归一化返回结果', async () => {
    global.fetch = jest.fn().mockResolvedValue(imageResponse()) as never;
    const model = {
      invoke: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          name: '伊利纯牛奶',
          productionDate: '2026-10-01',
          shelfLifeValue: 6,
          shelfLifeUnit: 'month',
          confidence: 'high',
        }),
      }),
    };
    const { service } = createService(model);

    const result = await service.recognize([
      'https://bucket.oss.example.com/items/a.jpg',
    ]);

    expect(result).toMatchObject({
      recognized: true,
      name: '伊利纯牛奶',
      productionDate: '2026-10-01',
      shelfLifeValue: 6,
      shelfLifeUnit: 'month',
      expiryDate: '2027-04-01',
    });
    const messages = model.invoke.mock.calls[0][0] as Array<{
      content: Array<{ type: string; image_url?: { url: string } }>;
    }>;
    const imagePart = messages[1].content.find(
      (part) => part.type === 'image_url',
    );
    expect(imagePart?.image_url?.url).toMatch(/^data:image\/jpeg;base64,/);
  });
});
