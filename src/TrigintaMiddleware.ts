/* eslint-disable @typescript-eslint/no-explicit-any */
import { IServiceContainer, IServiceModule } from '@aesop-fables/containr';
import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { createServiceNamespacer } from './Utils';
import { ITrigintaRuntime } from './ITrigintaRuntime';
import { ITrigintaRuntimeFactory } from './ITrigintaRuntimeFactory';
import { TrigintaServices } from './TrigintaServices';
import { EventSource } from './EventSource';

// TODO -- Not sure what this is going to turn into yet
export interface IRuntimeContext {
  container: IServiceContainer;
}

export interface TrigintaMiddlewareOptions {
  container: IServiceContainer;
  overrides: IServiceModule[];
  source: EventSource;
}

const runtimeContextKey = createServiceNamespacer('runtime')('context');

export function resolveTrigintaRuntime<TEvent, TContext extends Context = Context>(
  context: TContext,
): ITrigintaRuntime<TEvent, TContext> {
  return (context as any)[runtimeContextKey];
}

export function trigintaMiddlware<TEvent, TContext extends Context = Context>(options: TrigintaMiddlewareOptions) {
  const before: middy.MiddlewareFn<TEvent, any, Error, TContext> = async (request): Promise<void> => {
    const factory = options.container.get<ITrigintaRuntimeFactory>(TrigintaServices.RuntimeFactory);
    const runtime = await factory.createRuntime<TEvent, TContext>(request, {
      overrides: options.overrides,
      source: options.source,
    });
    const context = request.context as any;
    context[runtimeContextKey] = runtime;
  };

  const after: middy.MiddlewareFn<TEvent, any, Error, TContext> = async (request): Promise<void> => {
    resolveTrigintaRuntime(request.context)?.dispose();
  };

  return { after, before };
}
