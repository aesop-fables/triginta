import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { SQSRecord } from 'aws-lambda';
import { ISqsMessageHandler } from '../ISqsMessageHandler';
import { SqsLambda } from '../SqsLambda';
import { invokeSqsHandler } from '../invokeSqsHandler';

interface TestMessage {
  tenant: string;
  mesage: string;
}

const recorderKey = 'messageRecorder';

class MessageRecorder {
  readonly messages: TestMessage[] = [];

  record(message: TestMessage): void {
    this.messages.push(message);
  }
}

// @httpGet('/http-lambda/initialize')
class TestHandler implements ISqsMessageHandler<TestMessage> {
  constructor(@inject(recorderKey) private readonly recorder: MessageRecorder) {}
  async handle(message: TestMessage): Promise<void> {
    this.recorder.record(message);
  }
}

const useRecorder = createServiceModule('useRecorder', (services) =>
  services.register<MessageRecorder>(recorderKey, new MessageRecorder()),
);

describe('SqsLambda', () => {
  describe('initialize', () => {
    test('bootstraps the lambda', async () => {
      SqsLambda.initialize([useRecorder]);
      const container = SqsLambda.getContainer();
      await invokeSqsHandler({
        container: SqsLambda.getContainer(),
        handler: TestHandler,
        Records: [
          {
            awsRegion: 'us-west-2',
            messageId: 'test',
            eventSource: 'test',
            eventSourceARN: 'test',
            receiptHandle: 'test',
            messageAttributes: {},
            body: '',
          } as SQSRecord,
        ],
      });

      const recorder = container.get<MessageRecorder>(recorderKey);
      expect(recorder.messages.length).toBe(1);
    });
  });
});
