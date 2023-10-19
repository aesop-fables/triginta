import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('kinesis');

export const KinesisLambdaServices = {
  KinesisLambdaFactory: namedService('factory'),
  CurrentRecord: namedService('record'),
  DataSerializer: namedService('DataSerializer'),
  FailureHandler: namedService('FailureHandler'),
};
