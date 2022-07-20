import {
  dconfDataSymbol,
  Decorator,
  FetchInformation,
  Source,
  Target,
  ValueTransform,
} from "./types.ts";

function hydratorFactory(
  source: Source,
) {
  return function hydrator(
    keyOrTransform?: string | ValueTransform,
    ...transforms: ValueTransform[]
  ) {
    let key: string;
    if (typeof keyOrTransform === "string") {
      key = keyOrTransform;
    } else if (typeof keyOrTransform != "undefined") {
      transforms.unshift(keyOrTransform);
    }

    return function decorator<T extends Target>(
      target: T,
      propertyKey: keyof T,
    ): void {
      const array =
        (Reflect.getMetadata(dconfDataSymbol, target, propertyKey as string) ??
          []) as FetchInformation[];
      Reflect.defineMetadata(
        dconfDataSymbol,
        [
          ...array,
          { propertyKey, key, transforms, source } as FetchInformation,
        ],
        target,
        propertyKey as string,
      );
    };
  };
}

type HydrateFromEnv = {
  (): Decorator;
  (transform: ValueTransform, ...transforms: ValueTransform[]): Decorator;
  (envKey: string, ...transforms: ValueTransform[]): Decorator;
  (
    envKeyOrValueTransform?: string | ValueTransform,
    ...transforms: ValueTransform[]
  ): Decorator;
};

export const hydrateFromEnv: HydrateFromEnv = hydratorFactory(
  Source.ENV,
);

type HydrateFromCLI = {
  (): Decorator;
  (transform: ValueTransform, ...transforms: ValueTransform[]): Decorator;
  (param: string, ...transforms: ValueTransform[]): Decorator;
  (
    paramOrValueTransform?: string | ValueTransform,
    ...transforms: ValueTransform[]
  ): Decorator;
};

export const hydrateFromCLI: HydrateFromCLI = hydratorFactory(
  Source.CLI,
);

export function hydrate(...transforms: ValueTransform[]): Decorator {
  return function decorator<T extends Target>(
    target: T,
    propertyKey: keyof T,
  ): void {
    hydrateFromCLI(...transforms)(target, propertyKey);
    hydrateFromEnv(...transforms)(target, propertyKey);
  };
}
