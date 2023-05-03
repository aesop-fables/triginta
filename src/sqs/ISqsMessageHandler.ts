import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { ISqsMessage } from './ISqsMessage';

export declare type SqsOutput = SQSBatchResponse | void;

export interface ISqsMessageHandler<Message extends ISqsMessage, Output extends SqsOutput = void> {
  handle(message: Message, record: SQSRecord, event: SQSEvent): Promise<Output>;
}
