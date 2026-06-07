/**
 * Cache service interface and related types.
 * This interface defines the contract for a cache service that can store, retrieve, and delete cached items.
 */
export interface ICacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

/**
 * Interface for a generic cache service.
 * TValue represents the type of values stored in the cache.
 */
export interface ICacheService {
  /**
   * Retrieves a value from the cache.
   * @param key The key of the cached item.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value in the cache.
   * @param key The key of the cached item.
   * @param value The value to cache.
   * @param ttl The time-to-live for the cached item (in seconds).
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Deletes a value from the cache.
   * @param key The key of the cached item.
   */
  delete(key: string): Promise<void>;

  /**
   * Clears all items from the cache.
   */
  clear(): Promise<void>;
}
