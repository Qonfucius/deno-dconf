import { config as dotEnvConfig } from "https://deno.land/std@0.147.0/dotenv/mod.ts";
import "https://deno.land/x/reflection/mod.ts";
import { dconf, hydrate, hydrationConfig } from "../mod.ts";

await dotEnvConfig({ safe: true, export: true });

@hydrationConfig({
  prefixCli: "nested-",
  prefixEnv: "NESTED_",
})
class NestedConfig {
  @hydrate()
  name = "nested name";
}

class ConfigMap {
  @hydrate()
  public host = "localhost";
  @hydrate(Number)
  public port = 1667;
  @hydrate((v) => v === "true")
  public debug = false;
  
  public nested: NestedConfig = dconf(NestedConfig);
}

export const conf = dconf(ConfigMap);

console.log(conf);
