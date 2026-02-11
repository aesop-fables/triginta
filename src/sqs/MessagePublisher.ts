import { inject } from '@aesop-fables/containr';
import { ISqsPublisher } from './SqsPublisher';
import { SQSMessageAttributes } from 'aws-lambda';
import { SqsLambdaServices } from './SqsLambdaServices';
import { ISqsMessage } from './ISqsMessage';
import { LoggingLevel, LoggingServices } from '../logging';
import { TrigintaHeaders } from '../TrigintaHeaders';
import { MessageAttributeValue, SendMessageRequest, SendMessageResult } from '@aws-sdk/client-sqs';

declare type ConfigureSqsDelegate = (params: SendMessageRequest) => Promise<void>;

declare type MessageBodyAttributeMap = Record<string, MessageAttributeValue>;

export interface IMessagePublisher {
  publish(
    event: ISqsMessage,
    defaultAttributes?: SQSMessageAttributes,
    configure?: ConfigureSqsDelegate,
  ): Promise<SendMessageResult>;
}

export class MessagePublisher implements IMessagePublisher {
  // eslint-disable-next-line prettier/prettier
  constructor(
    @inject(SqsLambdaServices.SqsPublisher) private readonly sqsPublisher: ISqsPublisher,
    @inject(LoggingServices.Levels) private readonly levels: LoggingLevel,
  ) {}

  async publish(
    sqsMessage: ISqsMessage,
    defaultAttributes?: SQSMessageAttributes,
    configure?: ConfigureSqsDelegate,
  ): Promise<SendMessageResult> {
    const attributes = {
      ...messageTypeConverter(defaultAttributes ?? {}),
      ...messageTypeConverter(sqsMessage.getAttributes()),
    };

    const level = this.levels.resolveLevel();
    if (level) {
      attributes[TrigintaHeaders.LogLevel] = {
        DataType: 'String',
        StringValue: level,
      };
    }

    const params: SendMessageRequest = {
      MessageAttributes: attributes,
      MessageBody: sqsMessage.getBody(),
      QueueUrl: sqsMessage.getQueueUrl(),
    };

    if (typeof configure === 'function') {
      await configure(params);
    }

    return this.sqsPublisher.sendMessage(params);
  }
}

export function messageTypeConverter(attributes: SQSMessageAttributes): MessageBodyAttributeMap {
  const converted: MessageBodyAttributeMap = {};
  Object.entries(attributes).forEach(([key, val]) => {
    converted[key] = { DataType: val.dataType, StringValue: val.stringValue };
  });
  return converted;
}
