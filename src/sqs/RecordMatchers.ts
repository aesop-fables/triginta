import { SQSMessageAttributes, SQSRecord } from 'aws-lambda';
import { ISqsMessage, TrigintaMessageHeaders } from './ISqsMessage';
import { SqsLambdaServices } from './SqsLambdaServices';
import { inject, injectArray } from '@aesop-fables/containr';

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

export function retrieveMessageType(messageAttributes: SQSMessageAttributes): string {
  return messageAttributes[TrigintaMessageHeaders.MessageType]?.stringValue ?? '';
}

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
      type: retrieveMessageType(messageAttributes),
    } as Message;
  }
}

export interface ISqsMessageDeserializer {
  deserializeMessage<Message extends ISqsMessage>(record: SQSRecord): Promise<Message>;
}

export class SqsMessageDeserializer implements ISqsMessageDeserializer {
  constructor(
    @injectArray(SqsLambdaServices.RecordMatchers) private readonly matchers: ISqsRecordMatcher[],
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

export declare type MessageConfigAttributes<Message> = {
  [Property in keyof Message]: string;
};

export declare type MessageFactory<Message, Body> = (
  attributes: Partial<MessageConfigAttributes<Message>>,
  body: Body,
) => Promise<Message>;

export declare type MessageConfig<Message, Options> = {
  type: string;
  attributes: Partial<MessageConfigAttributes<Message>>;
  constructUsing: MessageFactory<Message, Options>;
};

export declare type MessageExpression<Message extends ISqsMessage> = Omit<
  Message,
  'getAttributes' | 'getBody' | 'getData'
>;

// Test coverage in SqsLambda.test.ts
export function createMatcher<Message extends ISqsMessage, Options>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  configuration: MessageConfig<MessageExpression<Message>, Options>,
): ISqsRecordMatcher {
  const { attributes: attributeMap, constructUsing, type } = configuration;

  const defaultMatcher = new DefaultSqsRecordMatcher();
  return {
    matches(record) {
      const { messageAttributes = {} } = record;
      const messageType = retrieveMessageType(messageAttributes);
      return messageType === type;
    },
    async deserializeMessage<T extends ISqsMessage>(record: SQSRecord): Promise<T> {
      const attributes: Partial<MessageConfigAttributes<MessageExpression<Message>>> = {};
      Object.entries(attributeMap).forEach(([key, val]) => {
        const { messageAttributes = {} } = record;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (attributes as any)[key] = messageAttributes[val]?.stringValue ?? '';
      });
      const body = await defaultMatcher.deserializeMessage<T>(record);
      const result = (await constructUsing(
        attributes,
        body as unknown as Options,
      )) as unknown as Message as unknown as T;
      return result;
    },
  } as ISqsRecordMatcher;
}
