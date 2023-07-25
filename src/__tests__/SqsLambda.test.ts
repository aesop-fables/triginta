/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { SQSMessageAttributes, SQSRecord } from 'aws-lambda';
import {
  TestUtils,
  ISqsMessageHandler,
  BaseSqsMessage,
  ISqsMessage,
  TrigintaMessageHeaders,
  createMatcher,
  IQueue,
  Queue,
  createTrigintaApp,
  SqsLambdaServices,
  ISqsRecordFailureHandler,
} from '..';

interface TestMessage extends ISqsMessage {
  type: string;
  tenant: string;
  mesage: string;
}

const recorderKey = 'messageRecorder';

interface IMessageRecorder<Message> {
  record(message: Message): void;
}

class MessageRecorder<Message> implements IMessageRecorder<Message> {
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
const JobQueue: IQueue = Queue.for('job', 'JOB_QUEUE_URL', 'job.job');

class SpinUpTenantMessage extends BaseSqsMessage {
  constructor(readonly tenant: string, readonly options: TenantOptions) {
    super(SpinUpMessageType, JobQueue);
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
  services.singleton<MessageRecorder<any>>(recorderKey, new MessageRecorder<any>()),
);

class RecordingFailureHandler implements ISqsRecordFailureHandler {
  readonly errors: any[] = [];

  async onError(record: SQSRecord, error: any): Promise<boolean> {
    this.errors.push(error);
    return true;
  }
}

const useErrorGeneratingRecorder = createServiceModule('useErrorGeneratingRecorder', (services) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services.singleton<IMessageRecorder<any>>(recorderKey, {
    record() {
      throw new Error(`Recorder`);
    },
  });

  services.singleton<ISqsRecordFailureHandler>(SqsLambdaServices.FailureHandler, new RecordingFailureHandler());
});

describe('SqsLambda', () => {
  describe('initialize', () => {
    test('bootstraps the lambda', async () => {
      const { containers } = createTrigintaApp({ sqs: { modules: [useRecorder] } });
      await TestUtils.invokeSqsHandler({
        container: containers.sqs,
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

      const recorder = containers.sqs.get<MessageRecorder<TestMessage>>(recorderKey);
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
      const {
        containers: { sqs: container },
      } = createTrigintaApp({
        sqs: {
          matchers: [matcher],
          modules: [useRecorder],
        },
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

    test('custom error middleware', async () => {
      const { containers } = createTrigintaApp({
        sqs: {
          modules: [useErrorGeneratingRecorder],
        },
      });
      const { sqs: container } = containers;

      const messageId = 'ab21cfc17e80409baaa5d301b628b6fe';
      const response = await TestUtils.invokeSqsHandler({
        container,
        handler: TestHandler<SpinUpTenantMessage>,
        Records: [
          {
            awsRegion: 'us-west-2',
            messageId,
            eventSource: 'aws:sqs',
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

      expect(response.batchItemFailures.length).toEqual(1);
      expect(response.batchItemFailures[0].itemIdentifier).toEqual(messageId);

      const failureHandler = container.get<RecordingFailureHandler>(SqsLambdaServices.FailureHandler);
      expect(failureHandler.errors.length).toEqual(1);
      expect(failureHandler.errors[0].message).toEqual('Recorder');
    });
  });
});
