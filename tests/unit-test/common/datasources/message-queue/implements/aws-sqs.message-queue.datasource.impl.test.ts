import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AwsSqsMessageQueueJobDatasource } from '@/common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl';
import { AwsSqsMessageQueueDatasource } from '@/common/datasources/message-queue/implements/aws-sqs.message-queue.datasource.impl';
import type { QueueRecord } from '@/common/types/datasources/message-queue.type';
import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const sqsMock = mockClient(SQSClient);

vi.mock(
  '@/common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl',
  () => ({
    AwsSqsMessageQueueJobDatasource: vi.fn(),
  }),
);

describe('AwsSqsMessageQueueDatasource', () => {
  let messageQueueDatasource: AwsSqsMessageQueueDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    sqsMock.reset();
    messageQueueDatasource = new AwsSqsMessageQueueDatasource(createMockAppConfig());
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
      const sqsClient = (messageQueueDatasource as unknown as { sqsClient: SQSClient }).sqsClient;

      expect(AwsSqsMessageQueueJobDatasource).toHaveBeenCalledWith(mockRawJob, sqsClient);
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
      const sqsClient = (messageQueueDatasource as unknown as { sqsClient: SQSClient }).sqsClient;

      expect(AwsSqsMessageQueueJobDatasource).toHaveBeenCalledWith(mockRawJob, sqsClient);
      expect(result).toBe(mockTypedJob);
    });
  });

  describe('push', () => {
    it('should send message to SQS with correct parameters', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data', timestamp: Date.now() });

      sqsMock.on(SendMessageCommand).resolves({});

      await messageQueueDatasource.push(queueUrl, payload);

      expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
      expect(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input).toEqual({
        QueueUrl: queueUrl,
        MessageBody: payload,
      });
    });

    it('should handle empty queue name', async () => {
      const queueUrl = '';
      const payload = JSON.stringify({ data: 'test' });

      sqsMock.on(SendMessageCommand).resolves({});

      await messageQueueDatasource.push(queueUrl, payload);

      expect(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input).toEqual({
        QueueUrl: '',
        MessageBody: payload,
      });
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

      sqsMock.on(SendMessageCommand).resolves({});

      await messageQueueDatasource.push(queueUrl, complexPayload);

      expect(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input).toEqual({
        QueueUrl: queueUrl,
        MessageBody: complexPayload,
      });
    });

    it('should propagate errors from SQS client', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data' });
      const error = new Error('SQS send failed');

      sqsMock.on(SendMessageCommand).rejects(error);

      await expect(messageQueueDatasource.push(queueUrl, payload)).rejects.toThrow(
        'SQS send failed',
      );
    });

    it('should handle network errors', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data' });
      const networkError = new Error('Network timeout');

      sqsMock.on(SendMessageCommand).rejects(networkError);

      await expect(messageQueueDatasource.push(queueUrl, payload)).rejects.toThrow(
        'Network timeout',
      );
    });

    it('should resolve when message is sent successfully', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'success' });

      sqsMock.on(SendMessageCommand).resolves({
        MessageId: 'test-message-id',
        MD5OfMessageBody: 'test-md5',
      });

      await expect(messageQueueDatasource.push(queueUrl, payload)).resolves.toBeUndefined();
    });
  });

  describe('constructor', () => {
    it('should create datasource instance', () => {
      const datasource = new AwsSqsMessageQueueDatasource(createMockAppConfig());
      expect(datasource).toBeInstanceOf(AwsSqsMessageQueueDatasource);
    });
  });
});
