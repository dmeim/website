declare module "iarna-toml-esm" {
  export function parse(input: string): Record<string, unknown>;
  export function stringify(value: Record<string, unknown>): string;
}
