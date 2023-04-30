import { LocalizedString } from '../localization';

export class ValidationMessage {
  constructor(readonly field: string, readonly localizedString: LocalizedString) {}

  toHash() {
    return `${this.field}:${this.localizedString.key}`;
  }
}
