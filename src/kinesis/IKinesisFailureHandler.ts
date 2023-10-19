import { KinesisStreamRecord } from 'aws-lambda';

/**
 * Represents the logic used to handle a failed SQS record.
 */
export interface IKinesisRecordFailureHandler {
  /**
   * Called when an error occurs during the processing an SQSEvent.
   * @param record The record that caused the error
   * @param error The error that occurred
   * @returns Whether or not to report the error (true to report; false to suppress).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError(record: KinesisStreamRecord, error: any): Promise<boolean>;
}

export class KinesisRecordFailureHandler implements IKinesisRecordFailureHandler {
  async onError(): Promise<boolean> {
    return true;
  }
}
