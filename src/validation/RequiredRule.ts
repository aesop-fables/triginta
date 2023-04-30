import { IValidationRule } from './IValidationRule';
import { ValidationContext } from './ValidationContext';
import { ValidationKeys } from './ValidationKeys';

export class RequiredRule implements IValidationRule {
  async validate(context: ValidationContext) {
    if (context.isEmpty()) {
      context.registerMessage(ValidationKeys.Required);
    }
  }
}
