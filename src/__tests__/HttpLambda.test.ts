import 'reflect-metadata';
import { createContainer, createServiceModule, IServiceContainer, Newable } from '@aesop-fables/containr';
import { APIGatewayProxyEventV2, Handler } from 'aws-lambda';
import { getRoute, httpGet, IHttpEndpoint } from '..';
import { HttpLambda, HttpLambdaFactory, IHttpLambdaFactory } from '../HttpLambda';
import { invokeHttpHandler } from '../invokeHttpHandler';
import { HttpLambdaServices } from '../HttpLambdaServices';

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
    it('no service modules', async () => {
      const { createHttpLambda } = HttpLambda.initialize();
      const handler = createHttpLambda(InitializeEndpoint);
      const response = await invokeHttpHandler(handler, {});

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
      const { createHttpLambda } = HttpLambda.initialize([useCustomFactory]);
      const handler = createHttpLambda(InitializeEndpoint);
      const response = await invokeHttpHandler(handler, {});

      expect(response).toBe('Hello! WORLD');
    });
  });
});

// describe('createHttpLambda', () => {
//   describe('get', () => {
//     test('using single middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware with multiple calls', () => {
//       throw new Error('Not Yet Implemented');
//     });
//   });
//   describe('put', () => {
//     test('using single middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware with multiple calls', () => {
//       throw new Error('Not Yet Implemented');
//     });
//   });
//   describe('post', () => {
//     test('using single middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware with multiple calls', () => {
//       throw new Error('Not Yet Implemented');
//     });
//   });
//   describe('delete', () => {
//     test('using single middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware', () => {
//       throw new Error('Not Yet Implemented');
//     });
//     test('using multiple middleware with multiple calls', () => {
//       throw new Error('Not Yet Implemented');
//     });
//   });
// });

//   test('Test the IHttpEndpoint handler', async () => {
//     const body: CreateStatusAlertRequest = {
//       app: 'Agent',
//       version: '1.0',
//       region: 'us-west',
//       message: 'Stop the presses!',
//       active: true,
//     };

//     const container = createContainer([setupCreateHttpLambdaTest]);
//     const handler = createHttpLambda(CreateStatusAlertEndpoint, container);

//     const response = await invokeHttpHandler(handler, { body });

//     const recordedRequest = container.get<Recorder>(TestServices.Recorder).request;

//     const endpointMetadata = getRoute(CreateStatusAlertEndpoint);

//     expect(endpointMetadata?.route).toEqual('testpath');

//     expect(response).toEqual({
//       id: '123',
//       ...recordedRequest,
//     });
//   });
// });
