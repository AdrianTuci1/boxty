import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf-8"));

// Build a CJS re-export shim
const cjs = `"use strict";
var mod = require("./index.js");
Object.keys(mod).forEach(function (k) {
  if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k))
    Object.defineProperty(exports, k, {
      enumerable: true,
      get: function () { return mod[k]; },
    });
});
`;

writeFileSync(resolve(__dirname, "../dist/index.cjs"), cjs);
console.log("CJS shim written to dist/index.cjs");
