// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IHandler<Message, Event = any, Return = void> {
  handle(message: Message, event: Event): Promise<Return>;
}
