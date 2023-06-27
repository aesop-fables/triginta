export interface ILogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export class NulloLogger implements ILogger {
  debug(): void {
    // no-op
  }
  info(): void {
    // no-op
  }
  warn(): void {
    // no-op
  }
  error(): void {
    // no-op
  }
}
