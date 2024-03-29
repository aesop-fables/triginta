import 'reflect-metadata';
import { any } from 'jest-mock-extended';
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';
import { BaseSqsMessage, SqsLambdaServices, MessagePublisher, IQueue, Queue, ISqsPublisher } from '..';
import { InteractionContext, createInteractionContext } from '@aesop-fables/containr-testing';
import { SQSMessageAttributes } from 'aws-lambda';

const jobQueue: IQueue = Queue.for('job', 'JOB_QUEUE_URL', 'job.job');

class TestStartUpMessage extends BaseSqsMessage {
  constructor(readonly type: string, readonly jobId: string) {
    super(type, jobQueue);
  }

  getAttributes(): SQSMessageAttributes {
    const baseAttributes = super.getAttributes();
    return {
      ...baseAttributes,
      'X-JobId': {
        dataType: 'String',
        stringValue: this.jobId,
      },
    };
  }
}

class TestMessage extends BaseSqsMessage {
  constructor(readonly type: string) {
    super(type, jobQueue);
  }
}

class TestBodyMessage extends BaseSqsMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(readonly type: string, readonly jobId: string, readonly body: any) {
    super(type, jobQueue);
  }

  getAttributes(): SQSMessageAttributes {
    const baseAttributes = super.getAttributes();
    return {
      ...baseAttributes,
      'X-JobId': {
        dataType: 'String',
        stringValue: this.jobId,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getData() {
    return this.body;
  }
}

describe('MessagePublisher', () => {
  let context: InteractionContext<MessagePublisher>;
  let testMessage: BaseSqsMessage;
  let message: SendMessageRequest;
  let result: SendMessageResult;
  const queue = 'job.job';
  const type = 'start-job';
  const jobId = '1234';
  const body = {
    firstName: 'greatest',
    lastName: 'ever',
  };

  beforeEach(() => {
    context = createInteractionContext(MessagePublisher);
  });

  test('MessagePublisher creates expected message', async () => {
    testMessage = new TestStartUpMessage(type, jobId);
    message = {
      MessageAttributes: {
        'X-Message-Type': {
          DataType: 'String',
          StringValue: type,
        },
        'X-JobId': {
          DataType: 'String',
          StringValue: jobId,
        },
      },
      MessageBody: '{}',
      QueueUrl: queue,
    };

    result = {
      MessageId: 'HappyPath',
    };

    // eslint-disable-next-line prettier/prettier
    context
      .mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher)
      .sendMessage.calledWith(any())
      .mockResolvedValue(Promise.resolve(result));

    const response = await context.classUnderTest.publish(testMessage);
    expect(response).toEqual(result);
    // eslint-disable-next-line prettier/prettier
    expect(
      context.mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher).sendMessage,
    ).toHaveBeenCalledWith(message);
  });

  test('Message does not contain JobID', async () => {
    testMessage = new TestMessage(type);
    message = {
      MessageAttributes: {
        'X-Message-Type': {
          DataType: 'String',
          StringValue: type,
        },
      },
      MessageBody: '{}',
      QueueUrl: queue,
    };

    result = {
      MessageId: 'HappyPath',
    };

    // eslint-disable-next-line prettier/prettier
    context
      .mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher)
      .sendMessage.calledWith(any())
      .mockResolvedValue(Promise.resolve(result));

    const response = await context.classUnderTest.publish(testMessage);
    expect(response).toEqual(result);
    // eslint-disable-next-line prettier/prettier
    expect(
      context.mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher).sendMessage,
    ).toHaveBeenCalledWith(message);
  });

  test('Message contains a body', async () => {
    testMessage = new TestBodyMessage(type, jobId, body);
    message = {
      MessageAttributes: {
        'X-Message-Type': {
          DataType: 'String',
          StringValue: type,
        },
        'X-JobId': {
          DataType: 'String',
          StringValue: jobId,
        },
      },
      MessageBody: JSON.stringify(body),
      QueueUrl: queue,
    };

    result = {
      MessageId: 'HappyPath',
    };

    // eslint-disable-next-line prettier/prettier
    context
      .mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher)
      .sendMessage.calledWith(any())
      .mockResolvedValue(Promise.resolve(result));

    const response = await context.classUnderTest.publish(testMessage);
    expect(response).toEqual(result);
    // eslint-disable-next-line prettier/prettier
    expect(
      context.mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher).sendMessage,
    ).toHaveBeenCalledWith(message);
  });

  test('Merges the default attributes', async () => {
    let found = false;
    const sqsPublisher: ISqsPublisher = {
      async sendMessage(): Promise<SendMessageResult> {
        return {};
      },
    };

    const publisher = new MessagePublisher(sqsPublisher, {
      resolveLevel() {
        return 'debug';
      },
    });

    const message = new TestBodyMessage(type, jobId, body);
    await publisher.publish(message, { 'X-Default': { dataType: 'String', stringValue: 'Test!' } }, async (x) => {
      const foundAttributes = x.MessageAttributes ?? {};
      found = foundAttributes['X-Default']?.StringValue === 'Test!';
    });

    expect(found).toBeTruthy();
  });

  test('Calls the configuration delegate', async () => {
    let params: SendMessageRequest | undefined;
    const sqsPublisher: ISqsPublisher = {
      async sendMessage(message: SendMessageRequest): Promise<SendMessageResult> {
        params = message;
        return {};
      },
    };

    const publisher = new MessagePublisher(sqsPublisher, {
      resolveLevel() {
        return 'debug';
      },
    });

    const message = new TestBodyMessage(type, jobId, body);
    await publisher.publish(message, {}, async (x) => {
      x.DelaySeconds = 1000;
    });

    expect(params?.DelaySeconds).toEqual(1000);
  });
});
