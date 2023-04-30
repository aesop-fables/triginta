import { inject } from '@aesop-fables/containr';
import { HttpLambdaServices } from '../http/HttpLambdaServices';
import { IRequestContext } from '../http/IRequestContext';
import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { IValidator } from './IValidator';
import { IValidatorFactory } from './IValidatorFactory';
import { Validator } from './Validator';

export class ValidatorFactory implements IValidatorFactory {
  constructor(@inject(HttpLambdaServices.RequestContext) private readonly context: IRequestContext) {}

  create(rules: IConfiguredValidationRule[]): IValidator {
    return new Validator(this.context.container, rules);
  }
}
