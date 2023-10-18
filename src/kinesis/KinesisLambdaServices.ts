import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('kinesis');

export const KinesisLambdaServices = {
  KinesisLambdaFactory: namedService('factory'),
  CurrentRecord: namedService('record'),
  FailureHandler: namedService('FailureHandler'),
};
