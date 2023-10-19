import { KinesisStreamRecord } from 'aws-lambda';

export interface IKinesisDataSerializer {
  deserializeRecord<Data>(record: KinesisStreamRecord): Promise<Data>;
}

export class KinesisDataSerializer implements IKinesisDataSerializer {
  async deserializeRecord<Data>(record: KinesisStreamRecord): Promise<Data> {
    const data = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
    console.log(data);
    return JSON.parse(data) as Data;
  }
}
