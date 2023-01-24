import { createContainer, createServiceModule, inject } from '@aesop-fables/containr';
import { IHttpEndpoint } from '..';
import { createHttpLambda, invokeHttpHandler } from '../HttpLambda';

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

class CreateStatusAlertEndpoint implements IHttpEndpoint<CreateStatusAlertRequest, StatusAlert> {
  constructor(@inject(TestServices.Recorder) private readonly recorder: IRecorder) {}
  async handle(request: CreateStatusAlertRequest): Promise<StatusAlert> {
    this.recorder.record(request);

    return {
      id: '123',
      ...request,
    };
  }
}

const setupCreateHttpLambdaTest = createServiceModule('test', (services) => {
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

    const container = createContainer([setupCreateHttpLambdaTest]);
    const handler = createHttpLambda(CreateStatusAlertEndpoint, container);

    const response = await invokeHttpHandler(handler, { body });

    const recordedRequest = container.get<Recorder>(TestServices.Recorder).request;

    expect(response).toEqual({
      id: '123',
      ...recordedRequest,
    });
  });
});
