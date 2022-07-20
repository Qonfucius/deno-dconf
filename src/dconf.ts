import { constantCase, paramCase, parse } from "./deps.ts";
import {
  dconfConfigSymbol,
  dconfDataSymbol,
  DConfOptions,
  FetchInformation,
  Instanciable,
  Source,
} from "./types.ts";

const args = parse(Deno.args);

if (!Reflect.getMetadata || !Reflect.defineMetadata) {
  throw new Error(
    "Metadata reflection API is needed, please import `https://deno.land/x/reflection/mod.ts` first",
  );
}

const defaultResolutionOrder = [Source.CLI, Source.ENV];

// deno-lint-ignore no-explicit-any
function proxyHandler<T extends Record<string | symbol, any>>(
  resolutionOrder: Source[] = defaultResolutionOrder,
): ProxyHandler<T> {
  return {
    get(target: T, propertyKey: keyof T): T[keyof T] {
      const config = (Reflect.getMetadata(
        dconfConfigSymbol,
        target.constructor,
      ) ?? {}) as DConfOptions;
      const values = (Reflect.getMetadata(
        dconfDataSymbol,
        target,
        propertyKey as string,
      ) ?? []) as FetchInformation[];

      for (const source of resolutionOrder) {
        const filteredValues = values.filter((info: FetchInformation) =>
          info.source === source
        );
        for (const info of filteredValues) {
          let normalizer;
          let key;
          let value;
          switch (source) {
            case Source.ENV:
              normalizer = config.normalizerEnv ?? constantCase;
              key = `${config.prefixEnv ?? ""}${
                info.key ?? normalizer(info.propertyKey)
              }`;
              value = Deno.env.get(key);
              break;
            case Source.CLI:
              normalizer = config.normalizerCli ?? paramCase;
              key = `${config.prefixCli ?? ""}${
                info.key ?? normalizer(info.propertyKey)
              }`;
              value = args[key];

              break;
          }
          if (typeof value != "undefined") {
            return info.transforms.reduce(
              (acc, cur) => cur(acc),
              value,
            ) as T[keyof T];
          }
        }
      }
      return target[propertyKey];
    },
  };
}

export const dconf = (
  CMap: Instanciable,
  resolutionOrder: Source[] = defaultResolutionOrder,
) => new Proxy(new CMap(), proxyHandler<typeof CMap>(resolutionOrder));
