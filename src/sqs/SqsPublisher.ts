import AWS from 'aws-sdk';
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs';

export interface ISqsPublisher {
  sendMessage(message: SendMessageRequest, region: string, apiVersion: string): Promise<SendMessageResult>;
}

export class SqsPublisher implements ISqsPublisher {
  private readonly sqs: AWS.SQS = new AWS.SQS();

  async sendMessage(message: SendMessageRequest, region: string, apiVersion: string): Promise<SendMessageResult> {
    this.sqs.config.region = region;
    this.sqs.config.apiVersion = apiVersion;
    const response = this.sqs.sendMessage(message).promise();
    if (!response) {
      throw new Error(`${response}`);
    }
    return response;
  }
}
