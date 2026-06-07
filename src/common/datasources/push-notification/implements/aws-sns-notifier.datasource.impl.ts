import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import type { INotifier } from '@/common/datasources/push-notification/push-notification.datasource';

export class SnsNotifier implements INotifier {
  constructor(protected readonly snsClient: SNSClient = new SNSClient()) {}

  async publishMessage(receiver: string, message: string): Promise<void> {
    const command = new PublishCommand({
      TargetArn: receiver,
      Message: message,
      MessageStructure: 'json',
    });
    await this.snsClient.send(command);
  }
}
