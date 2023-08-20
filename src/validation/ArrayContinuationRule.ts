import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { IValidationRule } from './IValidationRule';
import { IValidatorFactory } from './IValidatorFactory';
import { ValidationContext } from './ValidationContext';
import { ValidationServices } from './ValidationServices';

export class ArrayContinuationRule implements IValidationRule {
  constructor(private readonly field: string, private readonly schema: IConfiguredValidationRule[]) {}
  async validate(context: ValidationContext): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const array = context.value() as any[];
    if (!array || !Array.isArray(array) || !array.length) {
      return;
    }

    const factory = context.container.get<IValidatorFactory>(ValidationServices.ValidatorFactory);
    const validator = factory.create(this.schema);
    const arrayNotification = context.notification.forArray(this.field);
    for (let i = 0; i < array.length; i++) {
      const child = arrayNotification.forIndex(i);
      await validator.validate(array[i], child);

      arrayNotification.importAll(child);
    }

    context.notification.importAll(arrayNotification);
  }
}
