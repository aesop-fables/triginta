/* eslint-disable @typescript-eslint/no-explicit-any */
import { IServiceContainer } from '@aesop-fables/containr';
import { LocalizedString } from '../localization';
import { ValidationNotification } from './ValidationNotification';

declare type DefaultModel = { [key: string]: any };

export class ValidationContext<Model extends DefaultModel = DefaultModel> {
  constructor(
    readonly field: string,
    readonly target: Model,
    readonly notification: ValidationNotification,
    readonly container: IServiceContainer,
  ) {}

  registerMessage(localizedString: LocalizedString) {
    this.notification.registerMessage(this.field, localizedString);
  }

  get(key: string): any {
    return this.target[key];
  }

  value() {
    return this.get(this.field);
  }

  isSet(key: string) {
    const value = this.get(key);
    return typeof value !== 'undefined' && value != null && value.length !== 0;
  }

  isEmpty() {
    const value = this.value();
    if (typeof value === 'undefined' || value === null) {
      return true;
    }

    if (typeof value === 'string') {
      return value.length === 0 || value.trim().length === 0;
    }

    return false;
  }
}
