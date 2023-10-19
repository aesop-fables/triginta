/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IServiceContainer,
  IServiceModule,
  Scopes,
  createContainer,
  createServiceModule,
} from '@aesop-fables/containr';
import { ISqsRecordMatcher } from './sqs/RecordMatchers';
import { useHttpServices } from './http';
import { BootstrappedHttpLambdaContext, createBootstrappedHttpLambdaContext, useTrigintaHttp } from './http/HttpLambda';
import { useLocalization } from './localization';
import { useHttpValidation } from './validation';
import { BootstrappedSqsLambdaContext, createBootstrappedSqsLambdaContext, useTrigintaSqs } from './sqs/SqsLambda';
import { BootstrappedS3LambdaContext, createBootstrappedS3LambdaContext, useTrigintaS3 } from './s3/S3Lambda';
import { TrigintaServices, createCoreKey } from './TrigintaServices';
import { TrigintaRuntimeFactory } from './ITrigintaRuntimeFactory';
import { AwsServices } from './AwsServices';
import { ITrigintaRuntime } from './ITrigintaRuntime';
import { Context } from 'aws-lambda';
import { useTrigintaKinesis } from './kinesis';

declare type Placeholder = object;

interface AwsServiceCollection {
  http: Placeholder;
  kinesis: Placeholder;
  s3: Placeholder;
  sqs: Placeholder;
}

declare type ConfiguredServices<T> = {
  [Property in keyof AwsServiceCollection]: T;
};

interface BootstrappedTrigintaApp
  extends BootstrappedHttpLambdaContext,
    BootstrappedSqsLambdaContext,
    BootstrappedS3LambdaContext {
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
  kinesis?: TrigintaHttpOptions;
  s3?: TrigintaS3Options;
  sqs?: TrigintaSqsOptions;
}

export const useTriginta = createServiceModule(createCoreKey('bootstrap'), (services) => {
  services.autoResolve(TrigintaServices.RuntimeFactory, TrigintaRuntimeFactory, Scopes.Transient);
});

// The individual middlewares setup the runtime in the child container
// We're registering this here so that the defaults are in place
export const useAwsServices = createServiceModule(createCoreKey('bootstrap'), (services) => {
  services.factory<Context>(
    AwsServices.Context,
    (container) => {
      const runtime = container.get<ITrigintaRuntime<any, any>>(TrigintaServices.Runtime);
      return runtime.context;
    },
    Scopes.Transient,
  );

  services.factory(
    AwsServices.Event,
    (container) => {
      const runtime = container.get<ITrigintaRuntime<any, any>>(TrigintaServices.Runtime);
      return runtime.event;
    },
    Scopes.Transient,
  );
});

export function createTrigintaApp(options: TrigintaOptions): BootstrappedTrigintaApp {
  const containers = {} as ConfiguredServices<IServiceContainer>;
  Object.keys(options).forEach((key) => {
    const serviceKey = key as keyof AwsServiceCollection;
    const serviceOptions = options[key as keyof TrigintaOptions] ?? {};
    const { modules = [] } = options[key as keyof TrigintaOptions] ?? {};
    let container: IServiceContainer | undefined;
    switch (serviceKey) {
      case 'http':
        container = createContainer([
          useTriginta,
          useAwsServices,
          useTrigintaHttp,
          useHttpServices,
          useLocalization,
          useHttpValidation,
          ...modules,
        ]);
        break;
      case 'kinesis':
        container = createContainer([useTriginta, useAwsServices, useTrigintaKinesis, ...modules]);
        break;
      case 's3':
        container = createContainer([useTriginta, useAwsServices, useTrigintaS3, ...modules]);
        break;
      case 'sqs':
        const { matchers = [] } = serviceOptions as TrigintaSqsOptions;
        container = createContainer([useTriginta, useAwsServices, useTrigintaSqs({ matchers }), ...modules]);
        break;
    }

    if (container) {
      containers[serviceKey] = container;
    }
  });

  return {
    ...createBootstrappedHttpLambdaContext(containers.http),
    ...createBootstrappedSqsLambdaContext(containers.sqs),
    ...createBootstrappedS3LambdaContext(containers.s3),
    containers,
  };
}
