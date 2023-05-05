import { SettingsExpression } from '@aesop-fables/containr-dynamofx';
import { CreateQueueRequest } from 'aws-sdk/clients/sqs';

export interface IQueue extends CreateQueueRequest {
  toEnvExpression(): SettingsExpression<string>;
}

export class Queue {
  static for(name: string, variableName: string, defaultValue?: string): IQueue {
    return {
      QueueName: name,
      Attributes: {},
      tags: {},
      toEnvExpression(): SettingsExpression<string> {
        return { variable: variableName, defaultValue: defaultValue as string };
      },
    } as IQueue;
  }
}
