export class ObjectUtil {
  static isNil(value: unknown): boolean {
    return value === null || value === undefined;
  }
}

export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = obj[key];
    }
  }

  return result;
}

export function mapObjectName(
  obj: Record<string, any>,
  callbackConvertName: (key: string) => string,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newName = callbackConvertName(key);
      result[newName] = obj[key];
    }
  }

  return result;
}
