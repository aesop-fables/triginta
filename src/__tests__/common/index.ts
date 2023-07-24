import { createServiceModule, inject } from '@aesop-fables/containr';
import { IHttpEndpoint, httpPut } from '../../';
import { useMiddleware } from '../../Decorators';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHanlder from '@middy/http-error-handler';

export interface CreateStatusAlertRequest {
  app: string;
  version: string;
  region: string;
  message: string;
  active: boolean;
}

export interface StatusAlert {
  id: string;
  app: string;
  version: string;
  region: string;
  message: string;
  active: boolean;
}

export interface IRecorder {
  record(request: CreateStatusAlertRequest): void;
}

export class Recorder implements IRecorder {
  request?: CreateStatusAlertRequest;
  record(request: CreateStatusAlertRequest): void {
    this.request = request;
  }
}

export const TestServices = {
  Recorder: 'recorder',
};

@httpPut('testpath')
@useMiddleware(httpJsonBodyParser, httpErrorHanlder)
export class CreateStatusAlertEndpoint implements IHttpEndpoint<CreateStatusAlertRequest, StatusAlert> {
  constructor(@inject(TestServices.Recorder) private readonly recorder: IRecorder) {}
  async handle(request: CreateStatusAlertRequest): Promise<StatusAlert> {
    this.recorder.record(request);

    return {
      id: '123',
      ...request,
    };
  }
}

export const setupCreateHttpLambdaTest = createServiceModule('test', (services) => {
  services.register(TestServices.Recorder, () => new Recorder());
});
