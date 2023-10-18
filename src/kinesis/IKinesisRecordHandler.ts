import { KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';

export interface IKinesisRecordHandler {
  handle(record: KinesisStreamRecord, event: KinesisStreamEvent): Promise<void>;
}
