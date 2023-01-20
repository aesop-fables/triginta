// eslint-disable-next-line @typescript-eslint/no-explicit-any

export interface IHandler<Message = any, Event = any> {
  handle(message: Message, event: Event): Promise<void>;
}
