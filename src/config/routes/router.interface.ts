import type { TNewable } from '@/common/types/app.type';

/**
 * Base router interface for all routers
 */
export interface IRouter<TInvokeEvent> {
  registerController<T>(controllerClass: TNewable<T>): void;

  // create invoke abstract method to be implemented by child class
  invoke(event: TInvokeEvent): Promise<unknown>;
}
