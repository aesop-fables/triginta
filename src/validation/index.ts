import { createServiceModule } from '@aesop-fables/containr';
import { IValidator } from './IValidator';
import { Validator } from './Validator';
import { IValidatorFactory } from './IValidatorFactory';
import { ValidatorFactory } from './ValidatorFactory';
import { ValidationServices } from './ValidationServices';
import { IValidationFailureHandler, ValidatiionFailureHandler } from './IValidationFailureHandler';

export * from './IValidator';
export * from './Validator';
export * from './IValidatorFactory';
export * from './ValidatorFactory';
export * from './IValidationRule';
export * from './IConfiguredValidationRule';
export * from './RequiredRule';
export * from './RuleParser';
export * from './ValidationContext';
export * from './ValidationError';
export * from './ValidationKeys';
export * from './ValidationMessage';
export * from './ValidationMiddleware';
export * from './ValidationServices';
export * from './ValidationNotification';
export * from './IValidationFailureHandler';

export const useHttpValidation = createServiceModule('useHttpValidation', (services) => {
  services.use<IValidator>(ValidationServices.Validator, Validator);
  services.use<IValidatorFactory>(ValidationServices.ValidatorFactory, ValidatorFactory);
  services.use<IValidationFailureHandler>(ValidationServices.ValidationFailureHandler, ValidatiionFailureHandler);
});
