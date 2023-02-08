import { createServiceModule, inject } from '@aesop-fables/containr';
import { IHttpEndpoint, httpPut, getRoute, invokeHttpHandler } from '..';
import { HttpLambda } from '../HttpLambda';
import { getMiddleware, useMiddleware } from '../Decorators';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHanlder from '@middy/http-error-handler';
import { IConfiguredRoute } from '../IConfiguredRoute';

interface CreateStatusAlertRequest {
  app: string;
  version: string;
  region: string;
  message: string;
  active: boolean;
}

interface StatusAlert {
  id: string;
  app: string;
  version: string;
  region: string;
  message: string;
  active: boolean;
}

interface IRecorder {
  record(request: CreateStatusAlertRequest): void;
}

class Recorder implements IRecorder {
  request?: CreateStatusAlertRequest;
  record(request: CreateStatusAlertRequest): void {
    this.request = request;
  }
}

const TestServices = {
  Recorder: 'recorder',
};

@httpPut('testpath')
@useMiddleware(httpJsonBodyParser, httpErrorHanlder)
class CreateStatusAlertEndpoint implements IHttpEndpoint<CreateStatusAlertRequest, StatusAlert> {
  constructor(@inject(TestServices.Recorder) private readonly recorder: IRecorder) {}
  async handle(request: CreateStatusAlertRequest): Promise<StatusAlert> {
    // console.log('this.recorder', this.recorder);
    this.recorder.record(request);

    return {
      id: '123',
      ...request,
    };
  }
}

const setupCreateHttpLambdaTest = createServiceModule('test', (services) => {
  // console.log('register recorder');
  services.register(TestServices.Recorder, () => new Recorder());
});

describe('createHttpLambda', () => {
  test('Test the IHttpEndpoint handler', async () => {
    const body: CreateStatusAlertRequest = {
      app: 'Agent',
      version: '1.0',
      region: 'us-west',
      message: 'Stop the presses!',
      active: true,
    };

    // const { createHttpLambda } = HttpLambda.initialize([setupCreateHttpLambdaTest]);
    HttpLambda.initialize([setupCreateHttpLambdaTest]);
    const container = HttpLambda.getContainer();

    // const container = HttpLambda.getContainer();
    // const container = createContainer([setupCreateHttpLambdaTest]);
    // const handler = createHttpLambda(CreateStatusAlertEndpoint);

    const middlewareMetadata = getMiddleware(CreateStatusAlertEndpoint);
    // handler = middy(handler).use(middlewareMetadata?.middleware[0]());

    expect(middlewareMetadata ? middlewareMetadata[0] : '').toEqual(httpJsonBodyParser);

    const response = await invokeHttpHandler({
      configuredRoute: getRoute(CreateStatusAlertEndpoint) as IConfiguredRoute,
      container,
      body,
      path: 'testpath',
    });
    // console.log('response', response);

    const endpointMetadata = getRoute(CreateStatusAlertEndpoint);
    // console.log('endpointMetadata', endpointMetadata);

    expect(endpointMetadata?.route).toEqual('testpath');

    const recordedRequest = container.get<Recorder>(TestServices.Recorder).request;
    // console.log('recordedRequest', recordedRequest);

    expect(response).toEqual({
      id: '123',
      ...recordedRequest,
    });
  });
});
