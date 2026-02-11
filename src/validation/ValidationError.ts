/* eslint-disable @typescript-eslint/no-explicit-any */
export class ValidationError extends Error {
  constructor(
    message: string,
    readonly errors: any[],
  ) {
    super(message);
  }
}
