import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

import { getInstance as getAppConfigInstance } from '@/config/di/di.config';

vi.mock('@valkey/valkey-glide', () => ({
  GlideClient: {
    createClient: vi.fn(),
  },
}));

vi.mock('@/config/di/di.config', () => ({
  getInstance: vi.fn(),
}));

const mockAppConfig = (host?: string, port?: number) => ({
  elastiCacheConfig: { host, port },
});

describe('ValkeyClient', () => {
  let mockClient: object;
  let mockCreateClient: Mock;

  beforeEach(async () => {
    mockClient = {};
    const valkeyModule = await import('@valkey/valkey-glide');
    mockCreateClient = vi.mocked(valkeyModule.GlideClient.createClient);
    mockCreateClient.mockReset();
    mockCreateClient.mockResolvedValue(mockClient);
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new Valkey client if not already created', async () => {
    vi.mocked(getAppConfigInstance).mockReturnValue(mockAppConfig('localhost', 6379));
    const { ValkeyClient } = await import('@/common/datasources/cache/implements/valkey-client');
    const client = await ValkeyClient.getInstance();
    expect(client).toBe(mockClient);
    expect(mockCreateClient).toHaveBeenCalledWith({
      addresses: [{ host: 'localhost', port: 6379 }],
      useTLS: true,
    });
  });

  it('should return the same Valkey client instance on subsequent calls', async () => {
    vi.mocked(getAppConfigInstance).mockReturnValue(mockAppConfig('localhost', 6379));
    const { ValkeyClient } = await import('@/common/datasources/cache/implements/valkey-client');
    const client1 = await ValkeyClient.getInstance();
    const client2 = await ValkeyClient.getInstance();
    expect(client1).toBe(client2);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if ElastiCache HOST or PORT is not set', async () => {
    vi.mocked(getAppConfigInstance).mockReturnValue(mockAppConfig(undefined, undefined));
    const { ValkeyClient } = await import('@/common/datasources/cache/implements/valkey-client');
    await expect(ValkeyClient.getInstance()).rejects.toThrow('ElastiCache HOST or PORT is not set');
  });

  it('should cover private constructor', async () => {
    const { ValkeyClient } = await import('@/common/datasources/cache/implements/valkey-client');
    const instance = Reflect.construct(ValkeyClient, []);
    expect(instance).toBeInstanceOf(ValkeyClient);
  });
});
