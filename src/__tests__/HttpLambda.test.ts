import 'reflect-metadata';
import { createServiceModule, Newable } from '@aesop-fables/containr';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Handler } from 'aws-lambda';
import { getRoute, httpGet, IHttpEndpoint, IHttpEventHandler } from '..';
import { HttpLambda, HttpLambdaFactory, IHttpLambdaFactory, IHttpResponseGenerator } from '../HttpLambda';
import { invokeHttpHandler } from '../invokeHttpHandler';
import { HttpLambdaServices } from '../HttpLambdaServices';
import { IConfiguredRoute } from '../IConfiguredRoute';

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
      HttpLambda.initialize();
      const response = await invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        container: HttpLambda.getContainer(),
        rawPath: '/http-lambda/initialize',
      });

      expect(response.body).toBe('"Hello!"');
    });

    test('no input model', async () => {
      HttpLambda.initialize();
      const response = await invokeHttpHandler({
        configuredRoute: getRoute(InitializeWithoutInputEndpoint) as IConfiguredRoute,
        container: HttpLambda.getContainer(),
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

      HttpLambda.initialize([useCustomFactory]);
      const response = await invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        container: HttpLambda.getContainer(),
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
        services.register<IHttpResponseGenerator>(HttpLambdaServices.HttpResponseGenerator, () => {
          return new CustomHttpResponseGenerator();
        });
      });

      HttpLambda.initialize([useCustomFactory]);
      const response = await invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        container: HttpLambda.getContainer(),
        rawPath: '/http-lambda/initialize',
      });

      expect(response.body).toBe('Hello, World!');
    });
  });
});
