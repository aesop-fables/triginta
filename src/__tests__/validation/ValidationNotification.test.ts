import 'reflect-metadata';
import { Validation } from '../..';

const { ValidationKeys, ValidationNotification } = Validation;

describe('ValidationNotification', () => {
  test('registers messages for a key', () => {
    const notification = new ValidationNotification();
    notification.registerMessage('firstName', ValidationKeys.Required);

    const messages = notification.messagesFor('firstName');
    expect(messages.length).toBe(1);
    expect(messages[0].field).toBe('firstName');
    expect(messages[0].localizedString).toBe(ValidationKeys.Required);

    expect(notification.messagesFor('lastName').length).toBe(0);
  });

  test('retrieves all messages', () => {
    const notification = new ValidationNotification();
    notification.registerMessage('firstName', ValidationKeys.Required);
    notification.registerMessage('lastName', ValidationKeys.Required);

    const messages = notification.allMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].field).toBe('firstName');
    expect(messages[0].localizedString).toBe(ValidationKeys.Required);
    expect(messages[1].field).toBe('lastName');
    expect(messages[1].localizedString).toBe(ValidationKeys.Required);
  });

  test('isValid - negative', () => {
    const notification = new ValidationNotification();

    expect(notification.isValid()).toBeTruthy();
  });

  test('isValid - positive', () => {
    const notification = new ValidationNotification();
    notification.registerMessage('firstName', ValidationKeys.Required);
    notification.registerMessage('lastName', ValidationKeys.Required);

    expect(notification.isValid()).toBeFalsy();
  });

  test('imports messages for fields', () => {
    const notification = new ValidationNotification();
    const child = new ValidationNotification();
    child.registerMessage('firstName', ValidationKeys.Required);

    notification.importForField('firstName', child);

    const messages = notification.allMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].field).toBe('firstName');
    expect(messages[0].localizedString).toBe(ValidationKeys.Required);
  });
});
