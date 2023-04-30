import { ValidationContext } from './ValidationContext';

export interface IValidationRule {
  validate(context: ValidationContext): Promise<void>;
}
