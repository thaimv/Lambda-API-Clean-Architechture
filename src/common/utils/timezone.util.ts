/**
 * Utility functions for timezone operations
 */

import { TIMEZONE_REGEX } from '@/common/constants/app.const';
import { dayjsWithPlugins } from '@/common/utils/dayjs.util';

/**
 * Extracts timezone offset in minutes from timestamp string
 * @param timestamp - Timestamp string like "2025-05-26T11:55:31.878+09:00" or "2025-05-26T11:55:31.878Z"
 * @returns Offset in minutes (e.g., 540 for +09:00, 0 for Z)
 *
 * @example
 * extractTimezoneOffset("2025-05-26T11:55:31.878+09:00") // returns 540
 * extractTimezoneOffset("2025-05-26T11:55:31.878Z") // returns 0
 * extractTimezoneOffset("2025-05-26T11:55:31.878-05:00") // returns -300
 */

export const extractTimezoneOffset = (timestamp: string): number => {
  const timezoneMatch = timestamp.match(TIMEZONE_REGEX.TIMEZONE_OFFSET);

  if (!timezoneMatch) {
    return 0; // Default to UTC if no timezone found
  }

  const timezoneStr = timezoneMatch[1] || timezoneMatch[0];

  if (timezoneStr === 'Z') {
    return 0; // UTC
  }

  // Parse timezone offset like +09:00 or -05:00
  const offsetMatch = timezoneStr.match(TIMEZONE_REGEX.OFFSET_COMPONENTS);
  if (!offsetMatch) {
    return 0;
  }

  const [, sign, hours, minutes] = offsetMatch;
  const totalMinutes = parseInt(sign + hours) * 60 + parseInt(sign + minutes);
  // Handle edge case where -00:00 should be treated as +00:00 (UTC)
  return totalMinutes === 0 ? 0 : totalMinutes;
};

/**
 * Gets current time in a specific timezone offset
 * @param offsetMinutes - Timezone offset in minutes
 * @returns Current time in the specified timezone
 */
export const getCurrentTimeInTimezone = (offsetMinutes: number) => {
  return dayjsWithPlugins().utc().add(offsetMinutes, 'minute');
};
