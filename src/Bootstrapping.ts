import { IServiceContainer, IServiceModule, createContainer } from '@aesop-fables/containr';
import { ISqsRecordMatcher } from './sqs/RecordMatchers';
import { useHttpServices } from './http';
import { BootstrappedHttpLambdaContext, createBootstrappedHttpLambdaContext, useTrigintaHttp } from './http/HttpLambda';
import { useLocalization } from './localization';
import { useHttpValidation } from './validation';
import { BootstrappedSqsLambdaContext, createBootstrappedSqsLambdaContext, useTrigintaSqs } from './sqs/SqsLambda';

declare type Placeholder = object;

interface AwsServices {
  http: Placeholder;
  s3: Placeholder;
  sqs: Placeholder;
}

declare type ConfiguredServices<T> = {
  [Property in keyof AwsServices]: T;
};

interface BootstrappedTrigintaApp extends BootstrappedHttpLambdaContext, BootstrappedSqsLambdaContext {
  containers: ConfiguredServices<IServiceContainer>;
}

export interface AwsServiceOptions {
  modules: IServiceModule[];
}

export interface TrigintaHttpOptions extends AwsServiceOptions {}
export interface TrigintaS3Options extends AwsServiceOptions {}
export interface TrigintaSqsOptions extends AwsServiceOptions {
  matchers?: ISqsRecordMatcher[];
}

export interface TrigintaOptions {
  http?: TrigintaHttpOptions;
  s3?: TrigintaS3Options;
  sqs?: TrigintaSqsOptions;
}

export function createTrigintaApp(options: TrigintaOptions): BootstrappedTrigintaApp {
  const containers = {} as ConfiguredServices<IServiceContainer>;
  Object.keys(options).forEach((key) => {
    const serviceKey = key as keyof AwsServices;
    const serviceOptions = options[key as keyof TrigintaOptions] ?? {};
    const { modules = [] } = options[key as keyof TrigintaOptions] ?? {};
    let container: IServiceContainer | undefined;
    switch (serviceKey) {
      case 'http':
        container = createContainer([useTrigintaHttp, useHttpServices, useLocalization, useHttpValidation, ...modules]);
        break;
      case 's3':
        throw new Error('Not implemented');
        break;
      case 'sqs':
        const { matchers = [] } = serviceOptions as TrigintaSqsOptions;
        container = createContainer([useTrigintaSqs({ matchers }), ...modules]);
        break;
    }

    if (container) {
      containers[serviceKey] = container;
    }
  });

  return {
    ...createBootstrappedHttpLambdaContext(containers.http),
    ...createBootstrappedSqsLambdaContext(containers.sqs),
    containers,
  };
}
