import 'reflect-metadata';
import { createServiceModule, Newable } from '@aesop-fables/containr';
import { APIGatewayProxyEventV2, Handler } from 'aws-lambda';
import { getRoute, httpGet, IHttpEndpoint } from '..';
import { HttpLambda, HttpLambdaFactory, IHttpLambdaFactory } from '../HttpLambda';
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

describe('HttpLambda', () => {
  describe('initialize', () => {
    test('no service modules', async () => {
      HttpLambda.initialize();
      const response = await invokeHttpHandler({
        configuredRoute: getRoute(InitializeEndpoint) as IConfiguredRoute,
        path: '/http-lambda/initialize',
      });

      expect(response).toBe('Hello!');
    });

    test('override IHttpLambdaFactory', async () => {
      class CustomHttpLambdaFactory implements IHttpLambdaFactory {
        constructor(private readonly inner: IHttpLambdaFactory) {}
        createHandler<Input, Output>(
          newable: Newable<IHttpEndpoint<Input, Output>>,
        ): Handler<APIGatewayProxyEventV2, Output> {
          const inner = this.inner.createHandler(newable);
          return async (event, context, callback) => {
            const response = (await inner(event, context, callback)) as Output;
            return `${response} WORLD` as Output;
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
        path: '/http-lambda/initialize',
      });

      expect(response).toBe('Hello! WORLD');
    });
  });
});
