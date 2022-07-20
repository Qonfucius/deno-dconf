import { Target } from "./deps.ts";
export type { Target } from "./deps.ts";

export enum Source {
  CLI = "CLI",
  ENV = "ENV",
}

// deno-lint-ignore no-explicit-any
export type ValueTransform = (value: any) => any;
export type Decorator = <T extends Target>(
  target: T,
  propertyKey: keyof T,
) => void;
export interface FetchInformation {
  source: Source;
  transforms: ValueTransform[];
  key: string;
  propertyKey: string;
}

export interface DConfOptions {
  prefixCli?: string;
  prefixEnv?: string;
  normalizerCli?: (input: string) => string;
  normalizerEnv?: (input: string) => string;
}

// deno-lint-ignore ban-types
export type Instanciable = new () => object;

export const dconfConfigSymbol = Symbol("dconf config");
export const dconfDataSymbol = Symbol("dconf data");
