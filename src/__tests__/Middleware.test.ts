/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
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

    HttpLambda.initialize([setupCreateHttpLambdaTest]);
    const container = HttpLambda.getContainer();

    const middlewareMetadata = getMiddleware(CreateStatusAlertEndpoint) as any[];
    expect(middlewareMetadata[0]).toEqual(httpJsonBodyParser);

    const response = await invokeHttpHandler({
      configuredRoute: getRoute(CreateStatusAlertEndpoint) as IConfiguredRoute,
      container,
      body,
      path: 'testpath',
    });

    const endpointMetadata = getRoute(CreateStatusAlertEndpoint) as IConfiguredRoute;
    expect(endpointMetadata?.route).toEqual('testpath');

    const recordedRequest = container.get<Recorder>(TestServices.Recorder).request;
    expect(response).toEqual({
      id: '123',
      ...recordedRequest,
    });
  });
});
