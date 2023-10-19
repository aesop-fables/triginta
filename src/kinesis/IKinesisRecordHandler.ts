import { KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';

export interface IKinesisRecordHandler<Data> {
  handle(data: Data, record: KinesisStreamRecord, event: KinesisStreamEvent): Promise<void>;
}
