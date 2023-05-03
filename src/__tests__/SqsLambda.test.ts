import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { SQSMessageAttributes, SQSRecord } from 'aws-lambda';
import {
  TestUtils,
  ISqsMessageHandler,
  SqsLambda,
  BaseSqsMessage,
  ISqsMessage,
  TrigintaMessageHeaders,
  createMatcher,
} from '..';

interface TestMessage extends ISqsMessage {
  type: string;
  tenant: string;
  mesage: string;
}

const recorderKey = 'messageRecorder';

class MessageRecorder<Message> {
  readonly messages: Message[] = [];

  record(message: Message): void {
    this.messages.push(message);
  }
}

class TestHandler<Message extends ISqsMessage> implements ISqsMessageHandler<Message> {
  constructor(@inject(recorderKey) private readonly recorder: MessageRecorder<Message>) {}
  async handle(message: Message): Promise<void> {
    this.recorder.record(message);
  }
}

interface TenantOptions {
  id: string;
  subdomain: string;
}

const TenantKey = 'X-Tenant';
const SpinUpMessageType = 'spin-up';

class SpinUpTenantMessage extends BaseSqsMessage {
  constructor(readonly tenant: string, readonly options: TenantOptions) {
    super(SpinUpMessageType);
  }

  getAttributes() {
    return {
      ...super.getAttributes(),
      [TenantKey]: {
        dataType: 'String',
        stringValue: this.tenant,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(): any {
    return this.options;
  }
}

const useRecorder = createServiceModule('useRecorder', (services) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services.register<MessageRecorder<any>>(recorderKey, new MessageRecorder<any>()),
);

describe('SqsLambda', () => {
  describe('initialize', () => {
    test('bootstraps the lambda', async () => {
      const { container } = SqsLambda.initialize({ modules: [useRecorder] });
      await TestUtils.invokeSqsHandler({
        container,
        handler: TestHandler,
        Records: [
          {
            awsRegion: 'us-west-2',
            messageId: 'test',
            eventSource: 'test',
            eventSourceARN: 'test',
            receiptHandle: 'test',
            messageAttributes: {},
            body: '{}',
          } as SQSRecord,
        ],
      });

      const recorder = container.get<MessageRecorder<TestMessage>>(recorderKey);
      expect(recorder.messages.length).toBe(1);
    });
  });

  // I'm throwing this out there for future readers:
  // If you're writing integration tests against an SQS handler, PLEASE DO NOT ABSTRACT OUT THE SQS DETAILS
  // As much as possible, you WANT to be concerned with every detail of those damn records. It's annoying but it will pay off
  // in your debugging scenarios. I promise.
  describe('integration', () => {
    test('custom message deserialization', async () => {
      const matcher = createMatcher<SpinUpTenantMessage, TenantOptions>({
        attributes: { tenant: TenantKey },
        async constructUsing(attributes, body) {
          return new SpinUpTenantMessage(attributes?.tenant ?? '', body);
        },
        type: SpinUpMessageType,
      });
      const { container } = SqsLambda.initialize({
        matchers: [matcher],
        modules: [useRecorder],
      });
      await TestUtils.invokeSqsHandler({
        container,
        handler: TestHandler<SpinUpTenantMessage>,
        Records: [
          {
            awsRegion: 'us-west-2',
            messageId: 'test',
            eventSource: 'test',
            eventSourceARN: 'test',
            receiptHandle: 'test',
            messageAttributes: {
              [TrigintaMessageHeaders.MessageType]: { dataType: 'string', stringValue: SpinUpMessageType },
              [TenantKey]: { dataType: 'string', stringValue: 'my-tenant' },
            } as SQSMessageAttributes,
            body: JSON.stringify({ id: 'test', subdomain: 'first-dibs' } as TenantOptions),
          } as SQSRecord,
        ],
      });

      const recorder = container.get<MessageRecorder<SpinUpTenantMessage>>(recorderKey);
      expect(recorder.messages.length).toBe(1);
      expect(recorder.messages[0].tenant).toBe('my-tenant');
      expect(recorder.messages[0].options.id).toBe('test');
      expect(recorder.messages[0].options.subdomain).toBe('first-dibs');
    });
  });
});
