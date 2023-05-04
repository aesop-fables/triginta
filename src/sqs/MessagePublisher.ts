import { inject } from '@aesop-fables/containr';
import { MessageBodyAttributeMap, SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';
import { SqsPublisher } from './SqsPublisher';
import { SQSMessageAttributes } from 'aws-lambda';
import { SqsLambdaServices } from './SqsLambdaServices';
import { ISqsMessage } from './ISqsMessage';

export interface ConfigOptions {
  region: string;
  queue: string;
  apiVersion: string;
}

export interface IMessagePublisher {
  publish(event: ISqsMessage, config: ConfigOptions): Promise<SendMessageResult>;
}

export class MessagePublisher implements IMessagePublisher {
  // eslint-disable-next-line prettier/prettier
  constructor(
    @inject(SqsLambdaServices.SqsPublisher) private readonly sqsPublisher: SqsPublisher,
  ) {}

  async publish(event: ISqsMessage, config: ConfigOptions): Promise<SendMessageResult> {
    const message: SendMessageRequest = {
      MessageAttributes: messageTypeConverter(event.getAttributes()),
      MessageBody: event.getBody(),
      QueueUrl: config.queue,
    };

    return this.sqsPublisher.sendMessage(message, config.region, config.apiVersion);
  }
}

export function messageTypeConverter(attributes: SQSMessageAttributes): MessageBodyAttributeMap {
  const converted: MessageBodyAttributeMap = {};
  Object.entries(attributes).forEach(([key, val]) => {
    converted[key] = { DataType: val.dataType, StringValue: val.stringValue };
  });
  return converted;
}
