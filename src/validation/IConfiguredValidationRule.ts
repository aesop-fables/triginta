import { IValidationRule } from './IValidationRule';

export interface IConfiguredValidationRule {
  field: string;
  rule: IValidationRule;
}
