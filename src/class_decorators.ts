import { dconfConfigSymbol, DConfOptions, Instantiable } from "./types.ts";

function pushToConfigurationKey(
  target: Instantiable,
  key: keyof DConfOptions,
  value: DConfOptions[keyof DConfOptions],
) {
  const config = Reflect.getMetadata(dconfConfigSymbol, target) ?? {};
  return Reflect.defineMetadata(dconfConfigSymbol, {
    ...config as DConfOptions,
    [key]: value,
  }, target);
}

export function hydrationConfig(config: DConfOptions) {
  return function decorator(constructor: Instantiable) {
    Reflect.defineMetadata(dconfConfigSymbol, config, constructor);
  };
}

export function hydrationPrefixEnv(prefix: string) {
  return function decorator(constructor: Instantiable) {
    pushToConfigurationKey(constructor, "prefixEnv", prefix);
  };
}

export function hydrationPrefixCLI(prefix: string) {
  return function decorator(constructor: Instantiable) {
    pushToConfigurationKey(constructor, "prefixCli", prefix);
  };
}
