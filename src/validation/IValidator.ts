import { ValidationNotification } from './ValidationNotification';

export interface IValidator {
  validate<Model extends object>(model: Model): Promise<ValidationNotification>;
}
