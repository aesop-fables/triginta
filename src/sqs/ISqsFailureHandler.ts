import { SQSRecord } from 'aws-lambda';

/**
 * Represents the logic used to handle a failed SQS record.
 */
export interface ISqsRecordFailureHandler {
  /**
   * Called when an error occurs during the processing an SQSEvent.
   * @param record The record that caused the error
   * @param error The error that occurred
   * @returns Whether or not to report the error (true to report; false to suppress).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError(record: SQSRecord, error: any): Promise<boolean>;
}

export class SqsRecordFailureHandler implements ISqsRecordFailureHandler {
  async onError(): Promise<boolean> {
    return true;
  }
}
