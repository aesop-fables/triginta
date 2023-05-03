import { BaseSqsMessage, TrigintaMessageHeaders } from '../sqs/ISqsMessage';

class PassThruSqsMessage extends BaseSqsMessage {}

class CustomSqsMessage extends BaseSqsMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(): any {
    return { foo: 'bar' };
  }
}

describe('BaseSqsMessage', () => {
  describe('getAttributes()', () => {
    test('adds the message type as an attribute', () => {
      const message = new PassThruSqsMessage('test-message');
      const attributes = message.getAttributes();
      expect(attributes[TrigintaMessageHeaders.MessageType]?.stringValue).toBe('test-message');
    });
  });

  describe('getBody()', () => {
    test('empty json object when no data is returned', () => {
      const message = new PassThruSqsMessage('test-message');
      expect(message.getBody()).toBe('{}');
    });

    test('serializes the data', () => {
      const message = new CustomSqsMessage('test-message');
      expect(message.getBody()).toBe(JSON.stringify({ foo: 'bar' }));
    });
  });
});
