import { CreateQueueRequest } from 'aws-sdk/clients/sqs';
import { SettingsExpression } from '../ResolveEnvironmentSettings';

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
