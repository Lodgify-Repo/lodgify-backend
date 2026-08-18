import { AsyncLocalStorage } from 'async_hooks';
import { Prisma, PrismaClient } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

export const txStorage = new AsyncLocalStorage<TxClient>();

export class TransactionManager {
  public static async run<T>(prisma: PrismaClient, fn: () => Promise<T>): Promise<T> {
    if (txStorage.getStore()) {
      return fn();
    }

    return await prisma.$transaction(
      async (tx) => {
        return txStorage.run(tx, fn);
      },
      {
        timeout: 30000,
      }
    );
  }
}

/**
 * Proxy for PrismaService to auto-select transaction client if within a transaction context
 */
export function createPrismaProxy(prismaService: PrismaClient): PrismaClient {
  return new Proxy(prismaService, {
    get(target, prop) {
      const tx = txStorage.getStore();
      const source = tx ?? target;
      const value = source[prop as keyof typeof source];
      if (typeof value === 'function') {
        return value.bind(source);
      }
      return value;
    },
  }) as PrismaClient;
}
