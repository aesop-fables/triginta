import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('s3');

export const S3LambdaServices = {
  S3LambdaFactory: namedService('factory'),
  CurrentEvent: namedService('event'),
  CurrentRecord: namedService('record'),
};
