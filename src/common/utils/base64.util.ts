/**
 * Calculates the exact binary size (in bytes) of a Base64 encoded string.
 * This function uses purely mathematical evaluation, requiring $O(1)$ time
 * and zero additional memory footprint, making it ideal for huge payloads.
 *
 * Note: This assumes a continuous Base64 string without newlines or whitespace.
 *
 * Base64 algorithm specifically takes 3 bytes of binary data and translates them into
 *  exactly 4 characters.
 *  If the original data isn't perfectly divisible by 3, the algorithm uses padding
 *  characters (=) at the end of the string to ensure the final output length is a
 *  multiple of 4:
 *
 *  - If the original data ends with 1 extra byte, Base64 adds == (2 padding characters).
 *  - If the original data ends with 2 extra bytes, Base64 adds = (1 padding character).
 *
 * Because of this strict mathematical rule, the exact byte size can be calculated by
 *  looking at the string length minus the padding.
 *
 * @param base64Str - The Base64 encoded string
 * @returns The exact size in bytes of the decoded data
 */
export const getBinarySizeFromBase64 = (base64Str: string): number => {
  const len = base64Str.length;
  if (len === 0) return 0;

  // Base64 padding can only be 1 or 2 '=' characters at the very end
  let padding = 0;
  if (base64Str.charCodeAt(len - 1) === 0x3d) {
    // 0x3d is '='
    padding = base64Str.charCodeAt(len - 2) === 0x3d ? 2 : 1;
  }

  // Calculate formula: (length * 3 / 4) - padding
  return (len * 3) / 4 - padding;
};
