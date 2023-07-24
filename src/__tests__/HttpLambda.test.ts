import 'reflect-metadata';
import { createServiceModule, IServiceContainer, Newable, Scopes } from '@aesop-fables/containr';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Handler } from 'aws-lambda';
import {
  getRoute,
  httpGet,
  IHttpEndpoint,
  IHttpEventHandler,
  HttpLambdaFactory,
  IHttpLambdaFactory,
  IHttpResponseGenerator,
  HttpLambdaServices,
  IConfiguredRoute,
  TestUtils,
  createTrigintaApp,
  useMiddleware,
} from '..';
import middy from '@middy/core';
import { IRuntimeContext } from '../http/IRuntimeContext';
import { AwsServices } from '../AwsServices';

interface InitializeRequest {}

@httpGet('/http-lambda/initialize')
class InitializeEndpoint implements IHttpEndpoint<InitializeRequest, string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(message: InitializeRequest, event: APIGatewayProxyEventV2): Promise<string> {
    return 'Hello!';
  }
}

@httpGet('/http-lambda/initialize/without-input')
class InitializeWithoutInputEndpoint implements IHttpEventHandler<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(event: APIGatewayProxyEventV2): Promise<string> {
    return `Hello, ${event.headers['x-message']}`;
  }
}

describe('HttpLambda', () => {
  describe('initialize', () => {
    test('no service modules', async () => {
      const { containers } = createTrigintaApp({ http: { modules: [] } });
      const response = await TestUtils.invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        container: containers.http,
        rawPath: '/http-lambda/initialize',
      });

      expect(response.body).toBe('"Hello!"');
    });

    test('verify injected contextual services', async () => {
      let injectedContainer: IServiceContainer | undefined;
      function recordingMiddleware(): () => middy.MiddlewareObj<
        APIGatewayProxyEventV2,
        APIGatewayProxyStructuredResultV2
      > {
        return () => {
          return {
            async before(request) {
              injectedContainer = (request.context as unknown as IRuntimeContext).container;
            },
          };
        };
      }

      @httpGet('/http-lambda/injection')
      @useMiddleware(recordingMiddleware())
      class InjectionEndpoint implements IHttpEndpoint<InitializeRequest, string> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async handle(message: InitializeRequest, event: APIGatewayProxyEventV2): Promise<string> {
          return 'Hello!';
        }
      }

      const { containers } = createTrigintaApp({ http: { modules: [] } });
      await TestUtils.invokeHttpHandler({
        configuredRoute: getRoute(InjectionEndpoint) as IConfiguredRoute,
        container: containers.http,
        rawPath: '/http-lambda/injection',
      });

      expect(injectedContainer).toBeDefined();

      expect(injectedContainer?.get<IConfiguredRoute>(HttpLambdaServices.CurrentRoute)).toEqual(
        getRoute(InjectionEndpoint),
      );

      const event = injectedContainer?.get<APIGatewayProxyEventV2>(AwsServices.Event);
      expect(event?.rawPath).toEqual('/http-lambda/injection');

      const context = injectedContainer?.get<IRuntimeContext>(HttpLambdaServices.RuntimeContext);
      expect(context?.container).toEqual(injectedContainer);
    });

    test('no input model', async () => {
      const { containers } = createTrigintaApp({ http: { modules: [] } });
      const response = await TestUtils.invokeHttpHandler({
        configuredRoute: getRoute(InitializeWithoutInputEndpoint) as IConfiguredRoute,
        container: containers.http,
        headers: { 'x-message': 'sans-input!' },
        rawPath: '/http-lambda/initialize/without-input',
      });

      expect(response.body).toBe('"Hello, sans-input!"');
    });

    test('override IHttpLambdaFactory', async () => {
      class CustomHttpLambdaFactory implements IHttpLambdaFactory {
        constructor(private readonly inner: IHttpLambdaFactory) {}
        createEventHandler<Output>(
          newable: Newable<IHttpEventHandler<Output>>,
        ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
          return this.inner.createEventHandler(newable);
        }
        createHandler<Input, Output>(
          newable: Newable<IHttpEndpoint<Input, Output>>,
        ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
          const inner = this.inner.createHandler(newable);
          return async (event, context, callback) => {
            const response = (await inner(event, context, callback)) as APIGatewayProxyStructuredResultV2;
            return {
              ...response,
              body: `Hello, World!`,
            };
          };
        }
      }

      const useCustomFactory = createServiceModule('customHttpLambdaFactory', (services) => {
        services.register<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory, (container) => {
          const inner = new HttpLambdaFactory(container);
          return new CustomHttpLambdaFactory(inner);
        });
      });

      const { containers } = createTrigintaApp({
        http: {
          modules: [useCustomFactory],
        },
      });

      const response = await TestUtils.invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        container: containers.http,
        rawPath: '/http-lambda/initialize',
      });

      expect(response.body).toBe('Hello, World!');
    });

    test('override IHttpResponseGenerator', async () => {
      class CustomHttpResponseGenerator implements IHttpResponseGenerator {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async generateResponse(response?: any): Promise<APIGatewayProxyStructuredResultV2> {
          if (typeof response !== 'string') {
            throw new Error('Sorry, we cannot handle anything other than strings');
          }

          let proxyResponse = response as APIGatewayProxyStructuredResultV2;
          if (typeof proxyResponse?.statusCode === 'undefined') {
            proxyResponse = {
              statusCode: 200,
              body: 'Hello, World!',
            };
          }

          return proxyResponse;
        }
      }

      const useCustomFactory = createServiceModule('customHttpReponseGenerator', (services) => {
        services.factory<IHttpResponseGenerator>(
          HttpLambdaServices.HttpResponseGenerator,
          () => {
            return new CustomHttpResponseGenerator();
          },
          Scopes.Transient,
        );
      });

      const { containers } = createTrigintaApp({
        http: {
          modules: [useCustomFactory],
        },
      });
      const response = await TestUtils.invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        container: containers.http,
        rawPath: '/http-lambda/initialize',
      });

      expect(response.body).toBe('Hello, World!');
    });
  });
});
