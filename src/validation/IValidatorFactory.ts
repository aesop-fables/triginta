import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { IValidator } from './IValidator';

export interface IValidatorFactory {
  create(rules: IConfiguredValidationRule[]): IValidator;
}

