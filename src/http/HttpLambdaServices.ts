import { createServiceNamespacer } from '../Utils';

const keyFor = createServiceNamespacer('http');

export const HttpLambdaServices = {
  CurrentRoute: keyFor('currentRoute'),
  HttpLambdaFactory: keyFor('httpLambdaFactory'),
  HttpResponseGenerator: keyFor('httpResponseGenerator'),
  RuntimeContext: keyFor('runtimeContext'),
};
