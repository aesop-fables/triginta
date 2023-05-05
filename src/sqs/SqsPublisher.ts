import { inject } from '@aesop-fables/containr';
import AWS from 'aws-sdk';
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';
import { SqsLambdaServices } from './SqsLambdaServices';
import { SqsSettings } from './SqsSettings';

export interface ISqsPublisher {
  sendMessage(message: SendMessageRequest, region: string, apiVersion: string): Promise<SendMessageResult>;
}

export class SqsPublisher implements ISqsPublisher {
  private readonly sqs: AWS.SQS;
  constructor(@inject(SqsLambdaServices.SqsSettings) private readonly settings: SqsSettings) {
    this.sqs = new AWS.SQS({
      region: this.settings.region,
      apiVersion: this.settings.apiVersion,
    });
  }

  async sendMessage(message: SendMessageRequest): Promise<SendMessageResult> {
    const response = this.sqs.sendMessage(message).promise();
    if (!response) {
      throw new Error(`${response}`);
    }
    return response;
  }
}
