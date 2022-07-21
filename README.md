# dconf

> Config hydration as decorators

## TL;DR implementation

First, support decorators in deno.json config.

```json
{
  "experimentalDecorators": true
}
```

Then, don't forget allowances in run command :

- `--allow-env` to use environment variables
- `--allow-read` if you're using dotenv to access `.env`

```typescript
// Reflection API is required
import "https://deno.land/x/reflection@$VERSION/mod.ts";

// import Decorators and dconf
import {
  dconf,
  hydrate,
  hydrateFromCLI,
  hydrateFromEnv,
  hydrationConfig,
} from "https://deno.land/x/dconf@$VERSION/mod.ts";

// You can use dotenv from std library to import environment variables from
import { config as dotEnvConfig } from "https://deno.land/std@$VERSION/dotenv/mod.ts";
await dotEnvConfig({ safe: true, export: true });

// hydrationConfig annotation can be used to prefix all default variables
@hydrationConfig({
  prefixCli: "nested-",
  prefixEnv: "NESTED_",
})
class NestedConfig {
  // You will be able to use NESTED_NAME environment variable, or `--nested-name` CLI parameter here.
  @hydrate()
  name = "nested name";
}

class ConfigMap {
  // First (but optional) parameter of hydrateFromEnv, is the environment variable name.
  @hydrateFromEnv()
  public host = "localhost"; //If the environment variable is not set, then the default value is returned.
  // hydrate is an alias of hydrateFromEnv + hydrateFromCLI, without any possibility to set first parameter
  @hydrate(Number)
  public port = 1667;
  // Basically, a transformer is a function that take 1 any and return any.
  @hydrate((v) => v === "true")
  public debug = false;

  // Combine them all ! When you combine, priority is for CLI parameters first, then environment variables, in order of declaration.
  // In the following example, priority order is : --where-is-waldo, --bathroom, GARDEN, WHERE_IS_WALDO, then default value
  @hydrateFromEnv("GARDEN") // Allow to override via environment variable GARDEN
  @hydrate() // Allow to override via environment variable WHERE_IS_WALDO and CLI parameter `--where-is-waldo`
  @hydrateFromCLI("bathroom") // Allow to override via CLI parameter `--bathroom`
  public whereiswaldo: string = "In the kitchen"; // If the parameter is found nowhere, this default value is applied

  @hydrate()
  public optional?: string;

  // To have a deep configuration, just call another dconf Proxy.
  public nested: NestedConfig = dconf(NestedConfig);
}

// dconf function return a proxy of an instance of your class
export const conf = dconf(ConfigMap);
console.log(conf.nested.name); // nested name
```

## Getting Started

### Purpose

This library use typescript annotations to provide a readable and powerful
configuration solution, using many sources : environment variables & CLI

### Requirements

If you target to use environment variables, please allow them via `--allow-env`.

dconf require reflection API to be imported first.

```typescript
import "https://deno.land/x/reflection@$VERSION/mod.ts";
```

### Going further

dconf is working well with dotenv, just import first.

```typescript
import { config as dotEnvConfig } from "https://deno.land/std@$VERSION/dotenv/mod.ts";
await dotEnvConfig({ safe: true, export: true });
```

It's a must-have to use import_map to create an alias to your config file

```json
{
  "imports": {
    "@config": "./src/config.ts"
  }
}
```

```typescript
import config from "@config";
```

### Setup

Basically, you need to import third party dependencies, dconf and required
annotations.

```typescript
import "https://deno.land/x/reflection@$VERSION/mod.ts";

import { dconf, hydrate } from "https://deno.land/x/dconf@$VERSION/mod.ts";

class ConfigMap {
  @hydrate()
  public key: string;
}

// dconf function return a proxy of an instance of your class
export const conf = dconf(ConfigMap);
console.log(conf.key); // value from `KEY` or `--key`
```

### Multi-level configuration

To create nested configuration object, just create a class, and use a new dconf
Proxy

```typescript
class NestedConfig {
  @hydrate()
  name = "nested name";
}

class ConfigMap {
  public nested: NestedConfig = dconf(NestedConfig);
}

export const conf = dconf(ConfigMap);
console.log(conf.nested.name); // value from `NAME` or `--name`
```

You're able to prefix default keys of a dconf class, via decorator
`hydrationConfig`, like the following :

```typescript
@hydrationConfig({
  prefixCli: "nested-",
  prefixEnv: "NESTED_",
})
class NestedConfig {
  @hydrate()
  name = "nested name";
}

class ConfigMap {
  public nested: NestedConfig = dconf(NestedConfig);
}

export const conf = dconf(ConfigMap);
console.log(conf.nested.name); // value from `NESTED_NAME` or `--nested-name`
```

### Combinations

Many annotations exist with slightly differences.

- `@hydrate()` will add an awareness of CONSTANT_CASE environment variable + an
  awareness of param-case CLI parameter
- `@hydrateFromEnv(env?)` will add an awareness of CONSTANT_CASE environment
  variable, or for the custom name passed in first parameter
- `@hydrateFromEnv(cli?)` will add an awareness of param-case CLI parameter, or
  for the custom key passed in first parameter

It's possible to use many decorator for a single property, they will be resolved
in the following order :

1. All CLI parameters in order of apparition
2. All Env variables in order of apparition
3. default value

```typescript
class ConfigMap {
  @hydrateFromEnv("GARDEN") // Allow to override via environment variable GARDEN
  @hydrate() // Allow to override via environment variable WHERE_IS_WALDO and CLI parameter `--where-is-waldo`
  @hydrateFromCLI("bathroom") // Allow to override via CLI parameter `--bathroom`
  public whereiswaldo: string = "In the kitchen"; // If the parameter is found nowhere, this default value is applied
}

export const conf = dconf(ConfigMap);
console.log(conf.whereiswaldo); // So, where's waldo ?
```

### Transformations / cast

All decorators can take none to many arguments that will be chained and applied
to the fetched value.

## How it works

1. Annotations push in metadata an array of data sources
2. `dconf` return a Proxy behind a class instance. This proxy resolve this data
   sources array

## Predicted drawbacks

- Performances may be degraded, cause of a lake of caching system with Proxy
  pattern. (`deno bench --unstable benchmark/proxy_pattern.ts`)
- dconf is made to be read-only, `set` is not implemented

## Benchmark

For information, you can run a benchmark that will compare dconf with a simple
object that use `??` operator to test different locations via the following
command :

```shell
$ deno bench --unstable benchmark/config.ts --allow-env=KEY
Check file:///Users/panda/Projects/steuli/dconf/benchmark/config.ts
cpu: Apple M1
runtime: deno 1.23.3 (aarch64-apple-darwin)

file:///Users/panda/Projects/steuli/dconf/benchmark/config.ts
benchmark                    time (avg)             (min … max)       p75       p99      p995
--------------------------------------------------------------- -----------------------------
dconf                      1.48 µs/iter     (1.43 µs … 1.76 µs)   1.49 µs   1.76 µs   1.76 µs
Proxified function call  335.66 ns/iter (325.76 ns … 356.01 ns) 339.02 ns 355.39 ns 356.01 ns
```

## Contributions

Contributions are welcome, if you've an issue, a feature request, open an issue.
If you've an issue, a feature request AND time, submit a merge request ! In both
cases, more information are in the ticket, easier the answer will be.

Happy configuring ! 🎍

## License

This library is made in 🇫🇷 by [Qonfucius](qonfucius.fr), via their computer
engineering services [Qongzi](qongzi.fr). This library is published under MIT
license. Feel free to use for any usage.

You like this library ? Say thanks on the social network of your choice, it will
be appreciated 🤟
