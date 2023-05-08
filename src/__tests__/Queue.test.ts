import { IQueue, Queue } from '..';

describe('Queue', () => {
  const name = 'test';
  const variableName = 'testVariable';
  const defaultValue = 'test.test';
  let queue: IQueue;

  beforeEach(() => {
    queue = Queue.for(name, variableName, defaultValue);
  });

  test('verify the name', () => {
    expect(queue.QueueName).toBe(name);
  });

  test('verify toEnvExpression', () => {
    expect(queue.toEnvExpression().variable).toBe(variableName);
    expect(queue.toEnvExpression().defaultValue).toBe(defaultValue);
  });
});
