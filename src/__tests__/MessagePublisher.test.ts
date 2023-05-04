import 'reflect-metadata';
import { any } from 'jest-mock-extended';
import { ISqsPublisher } from '../sqs/SqsPublisher';
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';
import { BaseSqsMessage } from '../sqs/ISqsMessage';
import { SQSMessageAttributes } from 'aws-lambda';
import { SqsLambdaServices } from '../sqs/SqsLambdaServices';
import { MessagePublisher } from '../sqs/MessagePublisher';
import { InteractionContext, createInteractionContext } from '@aesop-fables/containr-testing';

class TestStartUpEvent extends BaseSqsMessage {
  constructor(readonly type: string, readonly jobId: string) {
    super(type);
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

class TestEvent extends BaseSqsMessage {
  constructor(readonly type: string) {
    super(type);
  }
}

class TestBodyEvent extends BaseSqsMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(readonly type: string, readonly jobId: string, readonly body: any) {
    super(type);
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
  let event: BaseSqsMessage;
  let message: SendMessageRequest;
  let result: SendMessageResult;
  const queue = 'StartJob';
  const type = 'start-job';
  const jobId = '1234';
  const region = 'region';
  const apiVersion = '123456';
  const body = {
    firstName: 'greatest',
    lastName: 'ever',
  };

  beforeEach(() => {
    context = createInteractionContext(MessagePublisher);
  });

  test('MessagePublisher creates expected message', async () => {
    event = new TestStartUpEvent(type, jobId);
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

    const config = {
      region,
      queue,
      apiVersion,
    };

    // eslint-disable-next-line prettier/prettier
    context
      .mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher)
      .sendMessage.calledWith(any(), any(), any())
      .mockResolvedValue(Promise.resolve(result));

    const response = await context.classUnderTest.publish(event, config);
    expect(response).toEqual(result);
    // eslint-disable-next-line prettier/prettier
    expect(
      context.mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher).sendMessage,
    ).toHaveBeenCalledWith(message, region, apiVersion);
  });

  test('Message does not contain JobID', async () => {
    event = new TestEvent(type);
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

    const config = {
      region,
      queue,
      apiVersion,
    };

    // eslint-disable-next-line prettier/prettier
    context
      .mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher)
      .sendMessage.calledWith(any(), any(), any())
      .mockResolvedValue(Promise.resolve(result));

    const response = await context.classUnderTest.publish(event, config);
    expect(response).toEqual(result);
    // eslint-disable-next-line prettier/prettier
    expect(
      context.mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher).sendMessage,
    ).toHaveBeenCalledWith(message, region, apiVersion);
  });

  test('Message contains a body', async () => {
    event = new TestBodyEvent(type, jobId, body);
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

    const config = {
      region,
      queue,
      apiVersion,
    };

    // eslint-disable-next-line prettier/prettier
    context
      .mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher)
      .sendMessage.calledWith(any(), any(), any())
      .mockResolvedValue(Promise.resolve(result));

    const response = await context.classUnderTest.publish(event, config);
    expect(response).toEqual(result);
    // eslint-disable-next-line prettier/prettier
    expect(
      context.mockFor<ISqsPublisher>(SqsLambdaServices.SqsPublisher).sendMessage,
    ).toHaveBeenCalledWith(message, region, apiVersion);
  });
});
