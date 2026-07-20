// Add `export const dynamic = "force-dynamic"` to every API route
// that uses searchParams, so the Next build doesn't warn about
// implicit dynamic usage. Idempotent — safe to re-run.

const fs = require("fs");
const path = require("path");

const apiRoot = path.join(process.cwd(), "app", "api");

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name === "route.ts") yield full;
  }
}

let changed = 0;
let skipped = 0;
for (const file of walk(apiRoot)) {
  const src = fs.readFileSync(file, "utf8");
  if (src.includes("export const dynamic")) {
    skipped += 1;
    continue;
  }
  const patched = src + '\n\nexport const dynamic = "force-dynamic";\nexport const revalidate = 0;\n';
  fs.writeFileSync(file, patched, "utf8");
  changed += 1;
  console.log("patched:", path.relative(process.cwd(), file));
}
console.log(`\n${changed} patched, ${skipped} already had the flag.`);
