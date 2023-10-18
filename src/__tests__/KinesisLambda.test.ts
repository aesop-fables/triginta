import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { KinesisStreamRecord, S3EventRecord } from 'aws-lambda';
import { TestUtils, IKinesisRecordHandler, createTrigintaApp } from '..';

const recorderKey = 'messageRecorder';

class MessageRecorder<Message> {
  readonly messages: Message[] = [];

  record(message: Message): void {
    this.messages.push(message);
  }
}

class TestHandler implements IKinesisRecordHandler {
  constructor(@inject(recorderKey) private readonly recorder: MessageRecorder<KinesisStreamRecord>) {}
  async handle(record: KinesisStreamRecord): Promise<void> {
    this.recorder.record(record);
  }
}

const useRecorder = createServiceModule('useRecorder', (services) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services.singleton<MessageRecorder<any>>(recorderKey, new MessageRecorder<any>()),
);

describe('KinesisLambda', () => {
  describe('initialize', () => {
    test('bootstraps the lambda', async () => {
      const { containers } = createTrigintaApp({ kinesis: { modules: [useRecorder] } });
      await TestUtils.invokeKinesisHandler({
        container: containers.kinesis,
        handler: TestHandler,
        Records: [
          {
            kinesis: {
              kinesisSchemaVersion: '1.0',
              partitionKey: '1',
              sequenceNumber: '49590338271490256608559692538361571095921575989136588898',
              data: 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0Lg==',
              approximateArrivalTimestamp: 1545084650.987,
            },
            eventSource: 'aws:kinesis',
            eventVersion: '1.0',
            eventID: 'shardId-000000000006:49590338271490256608559692538361571095921575989136588898',
            eventName: 'aws:kinesis:record',
            invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
            awsRegion: 'us-east-2',
            eventSourceARN: 'arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream',
          },
          {
            kinesis: {
              kinesisSchemaVersion: '1.0',
              partitionKey: '1',
              sequenceNumber: '49590338271490256608559692540925702759324208523137515618',
              data: 'VGhpcyBpcyBvbmx5IGEgdGVzdC4=',
              approximateArrivalTimestamp: 1545084711.166,
            },
            eventSource: 'aws:kinesis',
            eventVersion: '1.0',
            eventID: 'shardId-000000000006:49590338271490256608559692540925702759324208523137515618',
            eventName: 'aws:kinesis:record',
            invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
            awsRegion: 'us-east-2',
            eventSourceARN: 'arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream',
          },
        ],
      });

      const recorder = containers.kinesis.get<MessageRecorder<S3EventRecord>>(recorderKey);
      expect(recorder.messages.length).toBe(1);
    });
  });
});
