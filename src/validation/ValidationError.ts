export class ValidationError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, readonly errors: any[]) {
    super(message);
  }
}
