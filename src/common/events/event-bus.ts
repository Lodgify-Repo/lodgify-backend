import Logger from '@/infra/logger/logger.service';
import type { AppEvents } from './events';

type Handler<T> = (payload: T) => void | Promise<void>;
interface RegisteredHandler<T> {
  name: string;
  fn: Handler<T>;
}

const logger = Logger.getInstance('server');

export class EventBus {
  private static instance: EventBus;
  private handlers = new Map<keyof AppEvents, RegisteredHandler<AppEvents[keyof AppEvents]>[]>();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public async emit<TEvent extends keyof AppEvents>(event: TEvent, payload: AppEvents[TEvent], emitter: string): Promise<void> {
    const handlers = this.handlers.get(event) ?? [];
    logger.info(`[${emitter}] emitted: "${event}" (${handlers.length} handler(s))`);
    await Promise.all(
      handlers.map(async ({ name, fn }) => {
        try {
          logger.info(`[${name}] handling: "${event}"`);
          await fn(payload);
        } catch (error) {
          logger.error(`[${name}] failed handling "${event}":`, error);
        }
      })
    );
  }

  public on<TEvent extends keyof AppEvents>(event: TEvent, handler: Handler<AppEvents[TEvent]>, name: string): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, { name, fn: handler }]);
    logger.info(`[${name}] registered handler for "${event}"`);
  }
}

export default EventBus.getInstance();
