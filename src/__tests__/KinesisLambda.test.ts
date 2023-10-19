/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { KinesisStreamRecord } from 'aws-lambda';
import { TestUtils, IKinesisRecordHandler, createTrigintaApp } from '..';

const messageRecorderKey = 'messageRecorder';
const recordRecorderKey = 'recordRecorder';

class MessageRecorder<Message> {
  readonly messages: Message[] = [];

  record(message: Message): void {
    this.messages.push(message);
  }
}

interface SampleEvent {
  id: string;
  type: 'test1' | 'test2';
}

class TestHandler implements IKinesisRecordHandler<SampleEvent> {
  constructor(
    @inject(recordRecorderKey) private readonly recordRecorder: MessageRecorder<KinesisStreamRecord>,
    @inject(messageRecorderKey) private readonly messageRecorder: MessageRecorder<SampleEvent>,
  ) {}

  async handle(data: SampleEvent, record: KinesisStreamRecord): Promise<void> {
    this.recordRecorder.record(record);
    this.messageRecorder.record(data);
  }
}

const useRecorder = createServiceModule('useRecorder', (services) => {
  services.singleton<MessageRecorder<any>>(recordRecorderKey, new MessageRecorder<any>());
  services.singleton<MessageRecorder<any>>(messageRecorderKey, new MessageRecorder<any>());
});

const Records: KinesisStreamRecord[] = [
  {
    kinesis: {
      kinesisSchemaVersion: '1.0',
      partitionKey: '1',
      sequenceNumber: '49590338271490256608559692538361571095921575989136588898',
      data: 'eyAiaWQiOiAiMTIzNCIsICJ0eXBlIjogInRlc3QxIiB9',
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
      data: 'eyAiaWQiOiAiNTY3OCIsICJ0eXBlIjogInRlc3QyIiB9',
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
];

describe('KinesisLambda', () => {
  describe('initialize', () => {
    test('bootstraps the lambda', async () => {
      const { containers } = createTrigintaApp({ kinesis: { modules: [useRecorder] } });
      await TestUtils.invokeKinesisHandler({
        container: containers.kinesis,
        handler: TestHandler,
        Records,
      });

      const recorder = containers.kinesis.get<MessageRecorder<KinesisStreamRecord>>(recordRecorderKey);
      expect(recorder.messages.length).toEqual(2);
      expect(recorder.messages[0].kinesis.sequenceNumber).toEqual(Records[0].kinesis.sequenceNumber);
      expect(recorder.messages[1].kinesis.sequenceNumber).toEqual(Records[1].kinesis.sequenceNumber);

      const eventRecorder = containers.kinesis.get<MessageRecorder<SampleEvent>>(messageRecorderKey);
      expect(eventRecorder.messages.length).toEqual(2);
      expect(eventRecorder.messages[0].id).toEqual('1234');
      expect(eventRecorder.messages[0].type).toEqual('test1');

      expect(eventRecorder.messages[1].id).toEqual('5678');
      expect(eventRecorder.messages[1].type).toEqual('test2');
    });
  });
});
