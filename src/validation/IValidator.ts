import { ValidationNotification } from './ValidationNotification';

export interface IValidator {
  validate<Model extends object>(model: Model, notification?: ValidationNotification): Promise<ValidationNotification>;
}
