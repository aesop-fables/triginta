import { S3Event, S3EventRecord } from 'aws-lambda';

export interface IS3RecordHandler {
  handle(record: S3EventRecord, event: S3Event): Promise<void>;
}
