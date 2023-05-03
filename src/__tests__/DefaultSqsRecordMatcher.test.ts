import 'reflect-metadata';
import { SQSRecord } from 'aws-lambda';
import { ISqsMessage, TrigintaMessageHeaders } from '../sqs/ISqsMessage';
import { DefaultSqsRecordMatcher } from '../sqs/RecordMatchers';

interface TestMessage extends ISqsMessage {
  foo: string;
}

describe('DefaultSqsRecordMatcher', () => {
  describe('matches()', () => {
    test('always returns true', () => {
      const matcher = new DefaultSqsRecordMatcher();
      expect(matcher.matches()).toBeTruthy();
    });
  });

  describe('deserializeMessage()', () => {
    test('parses message body and adds type', async () => {
      const matcher = new DefaultSqsRecordMatcher();
      const result = await matcher.deserializeMessage<TestMessage>({
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
        },
        body: '{"foo":"bar"}',
      } as SQSRecord);
      expect(result.type).toEqual('test-message');
      expect(result.foo).toEqual('bar');
    });

    test('throw an error when the body is not valid json', async () => {
      const matcher = new DefaultSqsRecordMatcher();
      let hasError = false;
      try {
        await matcher.deserializeMessage<TestMessage>({
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
          },
          body: '%$T@%$YN',
        } as SQSRecord);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        hasError = true;
        expect(e.message).toContain('Invalid');
        expect(e.message).toContain('%$T@%$YN');
      }

      expect(hasError).toBeTruthy();
    });
  });
});
