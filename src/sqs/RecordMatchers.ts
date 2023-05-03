import { SQSRecord } from 'aws-lambda';
import { ISqsMessage, TrigintaMessageHeaders } from './ISqsMessage';
import { SqsLambdaServices } from './SqsLambdaServices';
import { inject } from '@aesop-fables/containr';

export interface ISqsRecordMatcher {
  matches(record: SQSRecord): boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deserializeMessage<Message extends ISqsMessage>(record: SQSRecord): Promise<Message>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonSafeParse = (text: any) => {
  if (typeof text !== 'string') return text;
  const firstChar = text[0];
  if (firstChar !== '{' && firstChar !== '[' && firstChar !== '"') return text;
  try {
    return JSON.parse(text);
  } catch (e) {}
  return text;
};

export class DefaultSqsRecordMatcher implements ISqsRecordMatcher {
  matches() {
    return true;
  }

  async deserializeMessage<Message extends ISqsMessage>(record: SQSRecord): Promise<Message> {
    const body = jsonSafeParse(record.body);
    if (typeof body === 'string' && body === record.body) {
      throw new Error(`Invalid JSON body for record ${record.messageId}: ${body}`);
    }

    const { messageAttributes = {} } = record;
    return {
      ...body,
      type: messageAttributes[TrigintaMessageHeaders.MessageType]?.stringValue ?? '',
    } as Message;
  }
}

export interface ISqsMessageDeserializer {
  deserializeMessage<Message extends ISqsMessage>(record: SQSRecord): Promise<Message>;
}

export class SqsMessageDeserializer implements ISqsMessageDeserializer {
  constructor(
    @inject(SqsLambdaServices.RecordMatchers) private readonly matchers: ISqsRecordMatcher[],
    @inject(SqsLambdaServices.DefaultRecordMatcher) private readonly defaultMatcher: ISqsRecordMatcher,
  ) {}

  async deserializeMessage<Message extends ISqsMessage>(record: SQSRecord): Promise<Message> {
    for (let i = 0; i < this.matchers.length; i++) {
      const matcher = this.matchers[i];
      if (matcher.matches(record)) {
        return matcher.deserializeMessage(record);
      }
    }
    return this.defaultMatcher.deserializeMessage(record);
  }
}
