/* eslint-disable @typescript-eslint/no-explicit-any */
import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { ITrigintaRuntime } from './ITrigintaRuntime';
import { IServiceContainer, IServiceModule, createServiceModule, injectContainer } from '@aesop-fables/containr';
import { EventSource } from './EventSource';
import { createServiceNamespacer } from './Utils';
import { TrigintaServices } from './TrigintaServices';

const namespacer = createServiceNamespacer('runtime');
const factoryModule = namespacer('factory');

export interface TrigintaRuntimeOptions {
  overrides: IServiceModule[];
  source: EventSource;
}

export interface ITrigintaRuntimeFactory {
  createRuntime<TEvent, TContext extends Context>(
    request: middy.Request<TEvent, any, Error, TContext>,
    options: TrigintaRuntimeOptions,
  ): Promise<ITrigintaRuntime<TEvent, TContext>>;
}

function embedRuntime<TEvent, TContext extends Context>(runtime: ITrigintaRuntime<TEvent, TContext>) {
  return createServiceModule(namespacer('embedRuntime'), (services) => {
    services.singleton(TrigintaServices.Runtime, runtime);
  });
}

export class TrigintaRuntimeFactory implements ITrigintaRuntimeFactory {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  async createRuntime<TEvent, TContext extends Context>(
    request: middy.Request<TEvent, any, Error, TContext>,
    options: TrigintaRuntimeOptions,
  ): Promise<ITrigintaRuntime<TEvent, TContext>> {
    const { context, event } = request;
    const runtime: ITrigintaRuntime<TEvent, TContext> = {
      context,
      event,
      source: options.source,
    } as ITrigintaRuntime<TEvent, TContext>;
    const overrides = [embedRuntime(runtime), ...options.overrides];
    const container = this.container.createChildContainer(factoryModule, overrides);

    runtime.container = container;
    runtime.dispose = () => {
      container?.dispose();
    };

    return runtime;
  }
}
