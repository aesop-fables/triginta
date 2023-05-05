import { SQSMessageAttributes } from 'aws-lambda';
import { resolveEnvironmentSettings } from '@aesop-fables/containr-dynamofx';
import { IQueue } from './IQueue';

export interface ISqsMessage {
  type: string;
  getAttributes(): SQSMessageAttributes;
  getBody(): string;
}

export const TrigintaMessageHeaders = {
  MessageType: 'X-Message-Type',
};

export abstract class BaseSqsMessage implements ISqsMessage {
  constructor(readonly type: string, readonly queue: IQueue) {}

  getQueueUrl(): string {
    const { queue } = resolveEnvironmentSettings({ queue: this.queue.toEnvExpression() });
    return queue as string;
  }

  getAttributes() {
    const attributes: SQSMessageAttributes = {
      [TrigintaMessageHeaders.MessageType]: {
        dataType: 'String',
        stringValue: this.type,
      },
    };
    return attributes;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(): any {
    return undefined;
  }

  getBody(): string {
    const data = this.getData() ?? {};
    return JSON.stringify(data);
  }
}
