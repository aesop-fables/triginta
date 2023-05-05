import { IQueue, Queue } from '../sqs/IQueue';
import { BaseSqsMessage, TrigintaMessageHeaders } from '../sqs/ISqsMessage';

class PassThruSqsMessage extends BaseSqsMessage {}

class CustomSqsMessage extends BaseSqsMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(): any {
    return { foo: 'bar' };
  }
}

let JobQueue: IQueue;

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

  describe('getQueueUrl() without environment variable', () => {
    test('returns QueueUrl from IQueue', () => {
      JobQueue =  Queue.for('job', 'JOB_QUEUE_URL', 'job.job');
      const message = new PassThruSqsMessage('test-message', JobQueue);
      expect(message.getQueueUrl()).toBe('job.job');
    });
  });

  describe('getQueueUrl() with environment variable', () => {
    test('returns QueueUrl from IQueue', () => {
      process.env.JOB_QUEUE_URL = 'test.job';
      JobQueue =  Queue.for('job', 'JOB_QUEUE_URL');
      const message = new PassThruSqsMessage('test-message', JobQueue);
      expect(message.getQueueUrl()).toBe('test.job');
    });
  });
});
