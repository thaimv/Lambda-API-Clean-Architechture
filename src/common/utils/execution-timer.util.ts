/**
 * Timer class to manage execution time
 */
export class ExecutionTimer {
  private readonly startTime: number;
  private readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    this.timeoutMs = timeoutMs;
    this.startTime = Date.now();
  }

  isWithinTimeLimit(): boolean {
    return Date.now() - this.startTime < this.timeoutMs;
  }
}
