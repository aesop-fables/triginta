import { createServiceNamespacer } from './Utils';

const keyFor = createServiceNamespacer('aws');

export const AwsServices = {
  Context: keyFor('context'),
  Event: keyFor('event'),
};
