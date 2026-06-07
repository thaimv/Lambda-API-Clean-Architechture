import path from 'path';

import dotenv from 'dotenv';

import { ObjectUtil } from '@/common/utils/object.util';

dotenv.config({
  path: [path.join(__dirname, '../../../envs/.env'), path.join(__dirname, '../envs/.env')],
});

/**
 * Retrieves the environment variable for the given key.
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (ObjectUtil.isNil(value)) {
    if (!ObjectUtil.isNil(defaultValue)) {
      return defaultValue!;
    }

    throw new Error(key + ' environment variable does not set');
  }

  return value!;
};
