import { SNSClient } from '@aws-sdk/client-sns';
import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import { SnsEndpointManager } from '@/common/datasources/push-notification/implements/aws-sns-endpoint-manager.datasource.impl';
import { SnsNotifier } from '@/common/datasources/push-notification/implements/aws-sns-notifier.datasource.impl';
import type {
  IEndpointManager,
  INotificationService,
  INotifier,
} from '@/common/datasources/push-notification/push-notification.datasource';
import { NOTIFICATION_PROVIDER } from '@/common/datasources/push-notification/push-notification.datasource';
import { BadRequestError } from '@/common/errors/bad-request-error';
import type { AppConfig } from '@/config/app.config';

@injectable()
export class NotificationService implements INotificationService {
  private readonly snsClient: SNSClient;
  private readonly notifiers = new Map<NOTIFICATION_PROVIDER, INotifier>();
  private readonly endpoints = new Map<NOTIFICATION_PROVIDER, IEndpointManager>();

  private readonly notifierFactories: Record<NOTIFICATION_PROVIDER, () => INotifier>;
  private readonly endpointFactories: Record<NOTIFICATION_PROVIDER, () => IEndpointManager>;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
    snsClient?: SNSClient,
  ) {
    this.snsClient = snsClient ?? new SNSClient({ region: appConfig.awsConfig.region });
    this.notifierFactories = {
      [NOTIFICATION_PROVIDER.SNS]: () => new SnsNotifier(this.snsClient),
    };
    this.endpointFactories = {
      [NOTIFICATION_PROVIDER.SNS]: () => new SnsEndpointManager(this.snsClient),
    };
  }

  getNotifier(provider: NOTIFICATION_PROVIDER = NOTIFICATION_PROVIDER.SNS): INotifier {
    return this.resolveInstance(this.notifiers, provider, this.notifierFactories);
  }

  getEndpointManager(
    provider: NOTIFICATION_PROVIDER = NOTIFICATION_PROVIDER.SNS,
  ): IEndpointManager {
    return this.resolveInstance(this.endpoints, provider, this.endpointFactories);
  }

  private resolveInstance<T>(
    cache: Map<NOTIFICATION_PROVIDER, T>,
    provider: NOTIFICATION_PROVIDER,
    factories: Record<NOTIFICATION_PROVIDER, () => T>,
  ): T {
    const cached = cache.get(provider);
    if (cached) return cached;

    const factory = factories[provider];
    if (!factory) throw new BadRequestError(`Unsupported notification provider: ${provider}`);

    const instance = factory();
    cache.set(provider, instance);
    return instance;
  }
}
