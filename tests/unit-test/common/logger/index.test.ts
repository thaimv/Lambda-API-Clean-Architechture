import { Logger } from '@aws-lambda-powertools/logger';
import { LogItem } from '@aws-lambda-powertools/logger';
import type { UnformattedAttributes } from '@aws-lambda-powertools/logger/types';
import { describe, it, expect, vi } from 'vitest';

import { CustomLogFormatter, logger } from '@/common/logger';

describe('CustomLogFormatter', () => {
  it('should format log attributes correctly', () => {
    const customFormatter = new CustomLogFormatter();

    // Mock input attributes
    const attributes = {
      logLevel: 'INFO',
      timestamp: new Date(),
      message: 'Test log message',
      lambdaContext: { awsRequestId: '123456789' },
    } as unknown as UnformattedAttributes;

    const additionalLogAttributes = { userId: 'user123' };
    const formattedLogItem = customFormatter.formatAttributes(attributes, additionalLogAttributes);

    const expectedAttributes = formattedLogItem.getAttributes();

    expect(formattedLogItem).toBeInstanceOf(LogItem);
    expect(expectedAttributes.logLevel).toBe(attributes.logLevel);
    expect(expectedAttributes.timestamp).toBeDefined();
    expect(expectedAttributes.message).toBe(attributes.message);
  });
});

describe('Logger', () => {
  it('should log a message with custom formatter', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'info');
    const message = 'Test log message';

    logger.info(message);

    expect(logSpy).toHaveBeenCalledWith(message);
    logSpy.mockRestore();
  });
});
