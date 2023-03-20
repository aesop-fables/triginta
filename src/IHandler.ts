/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IEventHandler<Event = any, Return = void> {
  handle(event: Event): Promise<Return>;
}

export interface IMessageHandler<Message, Event = any, Return = void> {
  handle(message: Message, event: Event): Promise<Return>;
}
