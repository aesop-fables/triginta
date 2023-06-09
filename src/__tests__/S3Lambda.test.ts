import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { S3EventRecord } from 'aws-lambda';
import { TestUtils, IS3RecordHandler, createTrigintaApp } from '..';

const recorderKey = 'messageRecorder';

class MessageRecorder<Message> {
  readonly messages: Message[] = [];

  record(message: Message): void {
    this.messages.push(message);
  }
}

class TestHandler implements IS3RecordHandler {
  constructor(@inject(recorderKey) private readonly recorder: MessageRecorder<S3EventRecord>) {}
  async handle(record: S3EventRecord): Promise<void> {
    this.recorder.record(record);
  }
}

const useRecorder = createServiceModule('useRecorder', (services) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services.singleton<MessageRecorder<any>>(recorderKey, new MessageRecorder<any>()),
);

describe('S3Lambda', () => {
  describe('initialize', () => {
    test('bootstraps the lambda', async () => {
      const { containers } = createTrigintaApp({ s3: { modules: [useRecorder] } });
      await TestUtils.invokeS3Handler({
        container: containers.s3,
        handler: TestHandler,
        Records: [
          {
            awsRegion: 'us-west-2',
            eventSource: 'test',
            eventSourceARN: 'test',
            s3: {
              bucket: {
                name: 'test-bucket',
              },
              object: {
                key: 'test-file.txt',
              },
            },
          } as unknown as S3EventRecord,
        ],
      });

      const recorder = containers.s3.get<MessageRecorder<S3EventRecord>>(recorderKey);
      expect(recorder.messages.length).toBe(1);
    });
  });
});
