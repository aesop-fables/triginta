import 'reflect-metadata';
import { SQSMessageAttributes, SQSRecord } from 'aws-lambda';
import { BaseSqsMessage, ISqsMessage, TrigintaMessageHeaders } from '../sqs/ISqsMessage';
import { DefaultSqsRecordMatcher, ISqsRecordMatcher, SqsMessageDeserializer } from '../sqs/RecordMatchers';

interface TestMessage extends ISqsMessage {
  foo: string;
}

class ComplexMessage extends BaseSqsMessage {
  constructor(readonly tenant: string) {
    super('complex');
  }
}

describe('SqsMessageDeserializer', () => {
  describe('when no matchers are registered', () => {
    test('uses the default', async () => {
      const deserializer = new SqsMessageDeserializer([], new DefaultSqsRecordMatcher());
      const result = await deserializer.deserializeMessage<TestMessage>({
        awsRegion: 'us-west-2',
        messageId: 'test',
        eventSource: 'test',
        eventSourceARN: 'test',
        receiptHandle: 'test',
        messageAttributes: {
          [TrigintaMessageHeaders.MessageType]: {
            dataType: 'string',
            stringValue: 'test-message',
          },
        } as SQSMessageAttributes,
        body: '{"foo":"bar"}',
      } as SQSRecord);
      expect(result.type).toEqual('test-message');
      expect(result.foo).toEqual('bar');
    });
  });

  describe('when matchers are registered', () => {
    test('uses the first matching one', async () => {
      const message = new ComplexMessage('test');
      const matcher: ISqsRecordMatcher = {
        matches() {
          return true;
        },
        async deserializeMessage<Message extends ISqsMessage>() {
          return message as unknown as Message;
        },
      };

      const deserializer = new SqsMessageDeserializer([matcher], new DefaultSqsRecordMatcher());
      const result = await deserializer.deserializeMessage<ComplexMessage>({
        awsRegion: 'us-west-2',
        messageId: 'test',
        eventSource: 'test',
        eventSourceARN: 'test',
        receiptHandle: 'test',
        messageAttributes: {
          [TrigintaMessageHeaders.MessageType]: {
            dataType: 'string',
            stringValue: 'test-message',
          },
          'X-Tenant': {
            dataType: 'string',
            stringValue: 'test',
          },
        } as SQSMessageAttributes,
        body: '{"foo":"bar"}',
      } as SQSRecord);

      expect(result).toBe(message);
    });
  });
});
