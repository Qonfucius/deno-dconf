import "https://deno.land/x/reflection/mod.ts";
import { dconf, hydrate } from "../mod.ts";

import { parse } from "https://deno.land/std@0.148.0/flags/mod.ts";
const args = parse(Deno.args);

class ConfigMap {
  @hydrate()
  public key = "value";
}

Deno.bench("dconf", () => {
  dconf(ConfigMap).key;
});

Deno.bench("Proxified function call", () => {
  const config = {
    key: args.key ?? Deno.env.get("KEY") ?? "value",
  };
  config.key;
});
