import { AsyncLocalStorage } from "node:async_hooks";

export type GatewayRatesMap = Record<string, { inputUsdPerM: number; outputUsdPerM: number }>;

const als = new AsyncLocalStorage<GatewayRatesMap>();

export function runWithGatewayRatesLookup<T>(lookup: GatewayRatesMap, fn: () => T): T {
  return als.run(lookup, fn);
}

export function getOptionalGatewayRatesLookup(): GatewayRatesMap | undefined {
  return als.getStore();
}
