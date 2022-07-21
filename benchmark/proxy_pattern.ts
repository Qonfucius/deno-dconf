const fn = () => 5;
const proxy = new Proxy(function () {}, {
  // deno-lint-ignore no-explicit-any
  apply: (_, context, args) => fn.apply(context, args as any),
});

const wrap = () => fn();

Deno.bench("Function call", () => {
  fn();
});

Deno.bench("Proxified function call", () => {
  proxy();
});

Deno.bench("Wrapped function call", () => {
  wrap();
});
