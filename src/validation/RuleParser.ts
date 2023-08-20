import { ArrayContinuationRule } from './ArrayContinuationRule';
import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { IValidationRule } from './IValidationRule';
import { RequiredRule } from './RequiredRule';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare type ValidationExpression<T> = {
  required?: boolean;
  custom?: IValidationRule[];
  array?: IConfiguredValidationRule[];
};

export declare type ValidationSchema<Model> = {
  [Property in keyof Model]: ValidationExpression<Model[Property]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseRules<Model>(schema: ValidationSchema<Model>) {
  const rules: IConfiguredValidationRule[] = [];
  Object.keys(schema).forEach((field) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldSchema = schema[field as keyof Model] as ValidationExpression<any>;
    if (typeof fieldSchema !== 'object') {
      throw Error(`Rules must be configured as an object (${field})`);
    }

    if (fieldSchema.required === true) {
      rules.push({
        field,
        rule: new RequiredRule(),
      });
    }

    const customRules = fieldSchema.custom ?? [];
    customRules.forEach((rule) =>
      rules.push({
        field,
        rule,
      }),
    );

    if (typeof fieldSchema.array !== 'undefined') {
      rules.push({
        field,
        rule: new ArrayContinuationRule(field, fieldSchema.array ?? []),
      });
    }
  });

  return rules;
}
