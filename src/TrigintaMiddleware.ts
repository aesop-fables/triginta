/* eslint-disable @typescript-eslint/no-explicit-any */
import { IServiceContainer, IServiceModule } from '@aesop-fables/containr';
import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { createServiceNamespacer } from './Utils';
import { ITrigintaRuntime } from './ITrigintaRuntime';
import { ITrigintaRuntimeFactory } from './ITrigintaRuntimeFactory';
import { TrigintaServices } from './TrigintaServices';
import { EventSource } from './EventSource';

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

interface MiddyHandler<TEvent, TContext extends Context = Context> {
  (event: TEvent, context: TContext): Promise<any>;
}

export function trigintafy<TEvent, TContext extends Context = Context>(
  handler: MiddyHandler<TEvent, TContext>,
  middlewareMetadata: any[],
  options: TrigintaMiddlewareOptions,
) {
  let midHandler = middy(handler).use(trigintaMiddlware(options));
  // eslint-disable-next-line @typescript-eslint/ban-types
  middlewareMetadata.forEach((midFunc: Function) => {
    midHandler = midHandler.use(midFunc());
  });

  return midHandler;
}
