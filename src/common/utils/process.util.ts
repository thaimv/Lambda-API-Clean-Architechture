/**
 * Delays the execution for a specified number of milliseconds.
 *
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified delay.
 */
export const wait = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));
