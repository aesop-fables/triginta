import { ValidationNotification } from './ValidationNotification';
import { IValidator } from './IValidator';
import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { ValidationContext } from './ValidationContext';
import { IServiceContainer } from '@aesop-fables/containr';

export class Validator implements IValidator {
  private readonly keys: string[];
  constructor(private readonly container: IServiceContainer, private readonly rules: IConfiguredValidationRule[]) {
    this.keys = [];

    rules.forEach(({ field }) => {
      if (this.keys.indexOf(field) === -1) {
        this.keys.push(field);
      }
    });
  }

  // not worrying about defensive coding on the model right now
  async validate<Model extends object>(
    model: Model,
    notification: ValidationNotification = new ValidationNotification(),
  ): Promise<ValidationNotification> {
    const promises = this.keys.map(async (field) => {
      await this.validateField(field, model, notification);
      // notification.importForField(field, child);
    });

    await Promise.all(promises);

    return notification;
  }

  private async validateField<Model extends object>(
    field: string,
    model: Model,
    child: ValidationNotification,
  ): Promise<ValidationNotification> {
    const context = new ValidationContext(field, model, child, this.container);
    const fieldRules = this.rules.filter((_) => _.field === field);
    await Promise.all(fieldRules.map(({ rule }) => rule.validate(context)));

    return child;
  }
}
