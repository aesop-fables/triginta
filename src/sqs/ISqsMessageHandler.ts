import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

export declare type SqsOutput = SQSBatchResponse | void;

export interface ISqsMessageHandler<Message, Output extends SqsOutput = void> {
  handle(message: Message, record: SQSRecord, event: SQSEvent): Promise<Output>;
}
