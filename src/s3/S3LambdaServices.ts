import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('s3');

export const S3LambdaServices = {
  S3LambdaFactory: namedService('factory'),
  CurrentRecord: namedService('record'),
};
