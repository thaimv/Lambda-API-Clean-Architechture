import type { DeviceEndpointId } from '@/common/types/datasources/push-notification.type';

export type EndpointAttributes = {
  metadata: Record<string, any>;
  enabled: boolean;
  token: string;
};

export enum NOTIFICATION_PROVIDER {
  SNS = 'sns',
}

export interface INotifier {
  publishMessage(receiver: string, message: string): Promise<void>;
}

export interface IEndpointManager {
  getAttributes(endpointId: string): Promise<EndpointAttributes>;
  setActive(endpointId: string, isEnabled: boolean): Promise<void>;
  create(token: string, platform: string): Promise<string>;
  delete(endpointId: string): Promise<void>;
  deleteDeviceEndpoints(endpointIds: DeviceEndpointId[]): Promise<void>;
}

export interface INotificationService {
  getNotifier(provider?: NOTIFICATION_PROVIDER): INotifier;
  getEndpointManager(provider?: NOTIFICATION_PROVIDER): IEndpointManager;
}
