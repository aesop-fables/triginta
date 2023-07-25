import { createServiceNamespacer } from './Utils';

export const createCoreKey = createServiceNamespacer('core');

export const TrigintaServices = {
  Runtime: createCoreKey('runtime'),
  RuntimeFactory: createCoreKey('runtimeFactory'),
};
