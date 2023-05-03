import 'reflect-metadata';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { ISqsMessageHandler, SqsLambda, TestUtils } from '..';
import { SQSEvent, SQSMessageAttributes, SQSRecord } from 'aws-lambda';
import { ISqsMessage } from '../sqs/ISqsMessage';

const { invokeSqsHandler } = TestUtils;
const RECORDER_KEY = 'eventRecorder';

interface IEndpointRecorder {
  recordEvent(event: SQSEvent): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordRequest(request: any): void;
}

interface ParsingMessage extends ISqsMessage {
  foo: string;
  bar: string;
}

class ParsingTestEndpoint implements ISqsMessageHandler<ParsingMessage> {
  constructor(@inject(RECORDER_KEY) private readonly events: IEndpointRecorder) {}
  async handle(message: ParsingMessage, record: SQSRecord, event: SQSEvent): Promise<void> {
    this.events.recordEvent(event);
    this.events.recordRequest(message);
  }
}

describe('invokeSqsHandler', () => {
  describe('middyified handlers', () => {
    it('test the json parsing', async () => {
      const events: SQSEvent[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];

      SqsLambda.initialize([
        createServiceModule('test', (services) => {
          services.register<IEndpointRecorder>(RECORDER_KEY, {
            recordEvent(event) {
              events.push(event);
            },
            recordRequest(request) {
              messages.push(request);
            },
          });
        }),
      ]);

      const container = SqsLambda.getContainer();
      const message: ParsingMessage = {
        foo: 'bar',
        bar: 'foo',
        type: '',
        getAttributes: function (): SQSMessageAttributes {
          throw new Error('Function not implemented.');
        },
        getBody: function (): string {
          throw new Error('Function not implemented.');
        },
      } as ParsingMessage;

      const body = JSON.stringify(message);

      await invokeSqsHandler({
        container,
        Records: [{ body } as SQSRecord],
        handler: ParsingTestEndpoint,
      });

      expect(messages[0]).toEqual(JSON.parse(body));

      const [event] = events;
      expect(event?.Records[0].body).toBe(body);
    });
  });
});
