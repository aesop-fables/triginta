export type LambdaMiddleware<Message> = (message: Message, next: () => Promise<void>) => Promise<void>;
