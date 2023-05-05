import { IQueue, Queue } from '../sqs/IQueue';
import { BaseSqsMessage, TrigintaMessageHeaders } from '../sqs/ISqsMessage';

class PassThruSqsMessage extends BaseSqsMessage {}

class CustomSqsMessage extends BaseSqsMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(): any {
    return { foo: 'bar' };
  }
}

const JobQueue: IQueue = Queue.for('job', 'JOB_QUEUE_URL', 'job.job');

describe('BaseSqsMessage', () => {
  describe('getAttributes()', () => {
    test('adds the message type as an attribute', () => {
      const message = new PassThruSqsMessage('test-message', JobQueue);
      const attributes = message.getAttributes();
      expect(attributes[TrigintaMessageHeaders.MessageType]?.stringValue).toBe('test-message');
    });
  });

  describe('getBody()', () => {
    test('empty json object when no data is returned', () => {
      const message = new PassThruSqsMessage('test-message', JobQueue);
      expect(message.getBody()).toBe('{}');
    });

    test('serializes the data', () => {
      const message = new CustomSqsMessage('test-message', JobQueue);
      expect(message.getBody()).toBe(JSON.stringify({ foo: 'bar' }));
    });
  });

  describe('getQueueUrl()', () => {
    test('returns QueueUrl from IQueue', () => {
      const message = new PassThruSqsMessage('test-message', JobQueue);
      expect(message.getQueueUrl()).toBe('job.job');
    });
  });
});
