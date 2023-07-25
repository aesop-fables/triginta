import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ISqsMessage } from './ISqsMessage';

export interface ISqsMessageHandler<Message extends ISqsMessage> {
  handle(message: Message, record: SQSRecord, event: SQSEvent): Promise<void>;
}
