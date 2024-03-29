import { LocalizedString } from '../localization';
import { ValidationMessage } from './ValidationMessage';

declare type MessageCache = { [key: string]: ValidationMessage[] | undefined };

export class ValidationNotification {
  private readonly messages: MessageCache = {};

  _getOrCreateMessages(field: string) {
    let messages = this.messages[field];
    if (typeof messages === 'undefined') {
      messages = [];
      this.messages[field] = messages;
    }

    return messages;
  }

  messagesFor(field: string) {
    return this._getOrCreateMessages(field);
  }

  registerMessage(field: string, localizedString: LocalizedString) {
    const message = new ValidationMessage(field, localizedString);
    let existing = null;
    this.eachMessage((msg) => {
      if (message.toHash() === msg.toHash()) {
        existing = msg;
      }
    });

    if (existing != null) return existing;

    const messages = this._getOrCreateMessages(field);
    messages.push(message);

    return message;
  }

  allMessages() {
    const messages: ValidationMessage[] = [];

    this.eachMessage((msg) => {
      messages.push(msg);
    });

    return messages;
  }

  eachMessage(action: (message: ValidationMessage) => void): void {
    const keys = Object.keys(this.messages);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const values = this._getOrCreateMessages(key);
      values.forEach((value) => {
        action(value);
      });
    }
  }

  isValid() {
    return this.allMessages().length === 0;
  }

  importForField(field: string, notification: ValidationNotification) {
    const current = this.messagesFor(field);
    notification.messagesFor(field).forEach((_) => current.push(_));
  }

  forArray(field: string) {
    return new PrefixedValidationNotification(field, false);
  }

  importAll(notification: ValidationNotification) {
    notification.eachMessage((msg) => {
      this.registerMessage(msg.field, msg.localizedString);
    });
  }
}

export class PrefixedValidationNotification extends ValidationNotification {
  constructor(protected readonly prefix: string, private readonly prefixRegistration = true) {
    super();
  }

  resolveFieldName(field: string): string {
    return `${this.prefix ?? ''}${field}`;
  }

  override registerMessage(field: string, localizedString: LocalizedString) {
    const resolvedField = this.prefixRegistration ? this.resolveFieldName(field) : field;
    return super.registerMessage(resolvedField, localizedString);
  }

  forIndex(index: number) {
    return new PrefixedValidationNotification(this.resolveFieldName(`[${index}].`));
  }
}
