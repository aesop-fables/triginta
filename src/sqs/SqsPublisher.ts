import { inject } from '@aesop-fables/containr';
import AWS from 'aws-sdk';
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';
import { SqsLambdaServices } from './SqsLambdaServices';
import { SqsSettings } from './SqsSettings';
import { ILogger } from '../logging/ILogger';
import { LoggingServices } from '../logging';

export interface ISqsPublisher {
  sendMessage(message: SendMessageRequest): Promise<SendMessageResult>;
}

export class SqsPublisher implements ISqsPublisher {
  private readonly sqs: AWS.SQS;
  constructor(
    @inject(SqsLambdaServices.SqsSettings) private readonly settings: SqsSettings,
    @inject(LoggingServices.Logger) private readonly logger: ILogger,
  ) {
    this.logger.debug(JSON.stringify(this.settings, null, 2));
    this.sqs = new AWS.SQS(this.settings);
  }

  async sendMessage(message: SendMessageRequest): Promise<SendMessageResult> {
    this.logger.debug(JSON.stringify(message, null, 2));
    const response = this.sqs.sendMessage(message).promise();
    if (!response) {
      throw new Error(`${response}`);
    }
    return response;
  }
}
