import { injectContainer, IServiceContainer } from '@aesop-fables/containr';
import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { IValidator } from './IValidator';
import { IValidatorFactory } from './IValidatorFactory';
import { Validator } from './Validator';

export class ValidatorFactory implements IValidatorFactory {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  create(rules: IConfiguredValidationRule[]): IValidator {
    return new Validator(this.container, rules);
  }
}
