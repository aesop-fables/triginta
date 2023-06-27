import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('logging');

export const LoggingServices = {
  Factory: namedService('factory'),
  Levels: namedService('levels'),
  Logger: namedService('logger'),
};
