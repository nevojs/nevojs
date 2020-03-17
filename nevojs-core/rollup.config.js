import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("./package.json");
const year = new Date().getFullYear();

const BANNER = `/*!
 * Nevo.js v${version}
 * (c) ${year} Aleksander Ciesielski
 * Released under the Apache-2.0 License.
 */`;

export default {
  input: "./src/exports.ts",
  output: {
    name: "nevo",
    file: "./dist/nevo.min.js",
    format: "iife",
  },
  plugins: [
    terser({
      output: {
        preamble: BANNER,
        comments: false,
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      keep_fnames: true,
    }),
    typescript({
      tsconfig: "tsconfig.json",
      tsconfigOverride: {
        compilerOptions: {
          module: "ES2015",
          target: "es5",
        },
      },
    }),
  ],
};
