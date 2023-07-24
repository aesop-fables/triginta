import { createServiceNamespacer } from '../Utils';

const keyFor = createServiceNamespacer('http');

export const HttpLambdaServices = {
  CurrentContext: keyFor('currentContext'),
  CurrentEvent: keyFor('currentEvent'),
  CurrentRoute: keyFor('currentRoute'),
  HttpLambdaFactory: keyFor('httpLambdaFactory'),
  HttpResponseGenerator: keyFor('httpResponseGenerator'),
  RuntimeContext: keyFor('runtimeContext'),
};
