import { inject } from '@aesop-fables/containr';
import { MessageBodyAttributeMap, SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';
import { SqsPublisher } from './SqsPublisher';
import { SQSMessageAttributes } from 'aws-lambda';
import { SqsLambdaServices } from './SqsLambdaServices';
import { ISqsMessage } from './ISqsMessage';
import { LoggingLevel, LoggingServices } from '../logging';
import { TrigintaHeaders } from '../TrigintaHeaders';

export interface IMessagePublisher {
  publish(event: ISqsMessage): Promise<SendMessageResult>;
}

export class MessagePublisher implements IMessagePublisher {
  // eslint-disable-next-line prettier/prettier
  constructor(
    @inject(SqsLambdaServices.SqsPublisher) private readonly sqsPublisher: SqsPublisher,
    @inject(LoggingServices.Levels) private readonly levels: LoggingLevel,
  ) {}

  async publish(sqsMessage: ISqsMessage): Promise<SendMessageResult> {
    const attributes = {
      ...messageTypeConverter(sqsMessage.getAttributes()),
    };

    const level = this.levels.resolveLevel();
    if (level) {
      attributes[TrigintaHeaders.LogLevel] = {
        DataType: 'String',
        StringValue: level,
      };
    }

    const message: SendMessageRequest = {
      MessageAttributes: attributes,
      MessageBody: sqsMessage.getBody(),
      QueueUrl: sqsMessage.getQueueUrl(),
    };

    return this.sqsPublisher.sendMessage(message);
  }
}

export function messageTypeConverter(attributes: SQSMessageAttributes): MessageBodyAttributeMap {
  const converted: MessageBodyAttributeMap = {};
  Object.entries(attributes).forEach(([key, val]) => {
    converted[key] = { DataType: val.dataType, StringValue: val.stringValue };
  });
  return converted;
}
