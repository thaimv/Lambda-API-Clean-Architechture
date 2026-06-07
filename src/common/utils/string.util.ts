import * as crypto from 'crypto';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { DATE_FORMAT } from '@/common/constants/app.const';

dayjs.extend(customParseFormat);

// Define UTF-8 Byte Order Mark (BOM) constant
const UTF8_BOM = '\uFEFF';

export class StringUtil {
  public static genRandomString(length: number): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Get Gigya UUID from Cognito Auth Provider
   * - cognitoAuthProvider sample '"gigya.yta","gigya.yta:eu-west-1:0287e4c8-0ef4-4108-82f0-3171b6410fbd:301bbfe6b63a4d92810fa362a1a742a7"'
   */
  public static getGigyaUuidFromCognitoAuthProvider(cognitoAuthProvider: string): string {
    const gigyaUuidRaw = cognitoAuthProvider.split(':')[3];
    if (gigyaUuidRaw?.endsWith('"')) {
      return gigyaUuidRaw.slice(0, -1);
    }
    return gigyaUuidRaw;
  }

  /**
   * Get username from event identity username
   * @param username - event identity username
   * @return username
   * @example
   * "XROA4XXXXXXYU3:CognitoIdentityCredentials" -> "XROA4XXXXXXYU3"
   */
  public static getUsernameFromIdentityUsername(username?: string): string {
    return username?.split(':')?.[0] || '';
  }
}

/**
 * Return the relative path portion of a given path or URL.
 *
 * If the input is a URL, use the pathname. If the input is a relative
 * path, return it as is. If the input is an absolute path, slice off the
 * leading slash.
 *
 * @param path The input path or URL
 * @return The relative path portion of the input
 * @example
 * getRelativePath('https://abc.com/images/logo.png') // 'images/logo.png'
 * getRelativePath('/images/logo.png') // 'images/logo.png'
 * getRelativePath('images/logo.png') // 'images/logo.png'
 */
export const getRelativePath = (path: string) => {
  try {
    // Attempt to parse as a URL
    const url = new URL(path);
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  } catch (e) {
    // Handle as a relative path
    return path.startsWith('/') ? path.slice(1) : path;
  }
};

/**
 * @function decodeBase64
 * @description Decodes a base64 encoded string to a Buffer.
 * @param {string} data - The base64 encoded string.
 * @returns {Buffer} - The decoded Buffer.
 */
export const decodeBase64 = (data: string): Buffer => {
  const buff = Buffer.from(data, 'base64');
  return buff;
};

/**
 * @function isValidDateFormat
 * @description Checks if a date string is in a valid format.
 * @param {string} dateString - The date string to validate.
 * @param {string} [dateFormat=DATE_FORMAT.YYYY_MM_DD] - The expected date format.
 * @returns {boolean} - True if the date string is in the specified format, false otherwise.
 */
export const isValidDateFormat = (dateString: string, dateFormat?: string): boolean => {
  if (!dateFormat) dateFormat = DATE_FORMAT.YYYY_MM_DD;
  return dayjs(dateString, dateFormat, true).isValid();
};

/**
 * Replaces placeholders in a template string with corresponding values from an object.
 *
 * This function takes a template string containing placeholders defined in the `templateForm`
 * constant and an object containing the values to replace those placeholders. It iterates
 * through the keys in `templateForm`, and for each key, it replaces all occurrences of the
 * corresponding placeholder in the template string with the value from the provided object,
 * if the value exists.
 *
 * @param {string} templateForm - The Form template
 * @param {object} templateValues - An object where keys correspond to the keys in `templateForm`
 *                                  (e.g., `COGNITO_ID`, `gigyaUuid`) and values are
 *                                  the strings that will replace the placeholders.
 * @param {string} templateString - The string containing placeholders to be replaced.
 *                                  Placeholders are defined in the `templateForm` constant,
 *                                  e.g., '{cognitoId}', '{gigyaUuid}'.
 * @returns {string} The modified string with all found placeholders replaced by their
 *                   corresponding values. If a value for a placeholder is not found
 *                   in the `values` object, the placeholder is left unchanged.
 *
 * @example
 * const myValues = {
 *   COGNITO_ID: 'user123',
 *   gigyaUuid: '1234567890',
 *   YYYY: '2023',
 *   MM: '10',
 *   DD: '27',
 * };
 * const replacedString = replaceTemplateValues(IMAGE_COMMON_S3_KEY, myValues);
 * replacedString will be: 'common/user123/1234567890.webp'
 */
export function replaceTemplateValues(
  templateForm: { [key: string]: string },
  templateValues: { [key: string]: string },
  templateString: string,
): string {
  let replacedString = templateString;

  for (const key in templateForm) {
    const templateKey = templateForm[key];
    const value = templateValues[key];
    if (value !== undefined) {
      replacedString = replacedString.replace(new RegExp(templateKey, 'g'), value);
    }
  }

  return replacedString;
}

/**
 * Convert string from snake_case to camelCase.
 *
 *
 * @param {string} str - The string in snake_case format.
 * @returns {string} The string converted to camelCase format.
 * @example ('user_id') --> "userId"
 */
export const snakeToCamelStr = (str: string): string =>
  str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/**
 * Removes the UTF-8 Byte Order Mark (BOM) from the beginning of a string if it exists.
 * @param value The string from which to remove the BOM.
 * @returns The string without the BOM.
 */
export const stripBom = (value: string): string =>
  value.startsWith(UTF8_BOM) ? value.slice(1) : value;
