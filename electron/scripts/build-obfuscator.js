import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
build({
  entryPoints: [path.join(__dirname, "obfuscate.ts")],
  bundle: true,
  platform: "node",
  outfile: path.join(__dirname, "obfuscate.js"),
  format: "esm",
})["catch"](() => process.exit(1));
