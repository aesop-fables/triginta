import { inject } from '@aesop-fables/containr';
import { SqsLambdaServices } from './SqsLambdaServices';
import { SqsSettings } from './SqsSettings';
import { ILogger } from '../logging/ILogger';
import { LoggingServices } from '../logging';
import { SendMessageRequest, SendMessageResult, SQS } from '@aws-sdk/client-sqs';

export interface ISqsPublisher {
  sendMessage(message: SendMessageRequest): Promise<SendMessageResult>;
}

export class SqsPublisher implements ISqsPublisher {
  private readonly sqs: SQS;
  constructor(
    @inject(SqsLambdaServices.SqsSettings) private readonly settings: SqsSettings,
    @inject(LoggingServices.Logger) private readonly logger: ILogger,
  ) {
    this.logger.debug(JSON.stringify(this.settings, null, 2));
    this.sqs = new SQS(this.settings);
  }

  async sendMessage(message: SendMessageRequest): Promise<SendMessageResult> {
    const response = this.sqs.sendMessage(message);
    if (!response) {
      throw new Error(`${response}`);
    }
    return response;
  }
}
