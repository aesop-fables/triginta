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
  async validate<Model extends object>(model: Model): Promise<ValidationNotification> {
    const notification = new ValidationNotification();
    const promises = this.keys.map(async (field) => {
      const child = await this.validateField(field, model);
      notification.importForField(field, child);
    });

    await Promise.all(promises);

    return notification;
  }

  private async validateField<Model extends object>(field: string, model: Model): Promise<ValidationNotification> {
    const child = new ValidationNotification();
    const context = new ValidationContext(field, model, child, this.container);
    const fieldRules = this.rules.filter((_) => _.field === field);
    await Promise.all(fieldRules.map(({ rule }) => rule.validate(context)));

    return child;
  }
}
