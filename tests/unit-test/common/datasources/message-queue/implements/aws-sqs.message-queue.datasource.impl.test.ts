import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AwsSqsMessageQueueJobDatasource } from '@/common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl';
import { AwsSqsMessageQueueDatasource } from '@/common/datasources/message-queue/implements/aws-sqs.message-queue.datasource.impl';
import type { QueueRecord } from '@/common/types/datasources/message-queue.type';
import { createMockAppConfig } from '~/common/helpers/app-config.helper';

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  SendMessageCommand: vi.fn(),
}));

vi.mock(
  '@/common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl',
  () => ({
    AwsSqsMessageQueueJobDatasource: vi.fn(),
  }),
);

describe('AwsSqsMessageQueueDatasource', () => {
  let messageQueueDatasource: AwsSqsMessageQueueDatasource;
  let mockSQSClient: SQSClient;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend = vi.fn();
    mockSQSClient = {
      send: mockSend,
    } as unknown as SQSClient;

    messageQueueDatasource = new AwsSqsMessageQueueDatasource(createMockAppConfig(), mockSQSClient);
  });

  describe('create', () => {
    it('should create a new AwsSqsMessageQueueJobDatasource with the provided raw job', () => {
      const mockRawJob: QueueRecord = {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify({ test: 'data' }),
        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
      };

      const mockJobInstance = { payload: { test: 'data' } };
      (AwsSqsMessageQueueJobDatasource as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        mockJobInstance,
      );

      const result = messageQueueDatasource.create(mockRawJob);

      expect(AwsSqsMessageQueueJobDatasource).toHaveBeenCalledWith(mockRawJob, mockSQSClient);
      expect(result).toBe(mockJobInstance);
    });

    it('should create AwsSqsMessageQueueJobDatasource with typed payload', () => {
      interface TestPayload {
        userId: string;
        action: string;
      }

      const mockRawJob: QueueRecord = {
        messageId: 'test-id',
        receiptHandle: 'handle',
        body: JSON.stringify({ userId: '123', action: 'test' }),
        eventSourceARN: 'arn',
      };

      const mockTypedJob = { payload: { userId: '123', action: 'test' } };
      (AwsSqsMessageQueueJobDatasource as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTypedJob,
      );

      const result = messageQueueDatasource.create<TestPayload>(mockRawJob);

      expect(AwsSqsMessageQueueJobDatasource).toHaveBeenCalledWith(mockRawJob, mockSQSClient);
      expect(result).toBe(mockTypedJob);
    });
  });

  describe('push', () => {
    it('should send message to SQS with correct parameters', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data', timestamp: Date.now() });

      mockSend.mockResolvedValue({});

      await messageQueueDatasource.push(queueUrl, payload);

      expect(SendMessageCommand).toHaveBeenCalledWith({
        QueueUrl: queueUrl,
        MessageBody: payload,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty queue name', async () => {
      const queueUrl = '';
      const payload = JSON.stringify({ data: 'test' });

      mockSend.mockResolvedValue({});

      await messageQueueDatasource.push(queueUrl, payload);

      expect(SendMessageCommand).toHaveBeenCalledWith({
        QueueUrl: '',
        MessageBody: payload,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle complex payload objects', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const complexPayload = JSON.stringify({
        itemType: 'TYPE_A',
        resourceId: '550e8400-e29b-41d4-a716-446655440000',
        mileage: 120.5,
        nested: {
          data: {
            value: 'test',
          },
        },
      });

      mockSend.mockResolvedValue({});

      await messageQueueDatasource.push(queueUrl, complexPayload);

      expect(SendMessageCommand).toHaveBeenCalledWith({
        QueueUrl: queueUrl,
        MessageBody: complexPayload,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from SQS client', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data' });
      const error = new Error('SQS send failed');

      mockSend.mockRejectedValue(error);

      await expect(messageQueueDatasource.push(queueUrl, payload)).rejects.toThrow(
        'SQS send failed',
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data' });
      const networkError = new Error('Network timeout');

      mockSend.mockRejectedValue(networkError);

      await expect(messageQueueDatasource.push(queueUrl, payload)).rejects.toThrow(
        'Network timeout',
      );
    });

    it('should resolve when message is sent successfully', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'success' });

      mockSend.mockResolvedValue({
        MessageId: 'test-message-id',
        MD5OfMessageBody: 'test-md5',
      });

      await expect(messageQueueDatasource.push(queueUrl, payload)).resolves.toBeUndefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('constructor', () => {
    it('should use default SQSClient when not provided', () => {
      const datasourceWithDefaultClient = new AwsSqsMessageQueueDatasource(createMockAppConfig());
      expect(datasourceWithDefaultClient).toBeInstanceOf(AwsSqsMessageQueueDatasource);
    });

    it('should use provided SQSClient', () => {
      const customClient = new SQSClient({ region: 'us-west-2' });
      const datasourceWithCustomClient = new AwsSqsMessageQueueDatasource(
        createMockAppConfig(),
        customClient,
      );
      expect(datasourceWithCustomClient).toBeInstanceOf(AwsSqsMessageQueueDatasource);
    });
  });
});
