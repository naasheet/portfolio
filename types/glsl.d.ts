// GLSL files import as plain strings (raw-loader under Turbopack, asset/source under webpack;
// see next.config.ts).
declare module "*.glsl" {
  const source: string;
  export default source;
}
