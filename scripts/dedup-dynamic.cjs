// Remove duplicate `export const dynamic = "force-dynamic"` and
// `export const revalidate = 0` lines that the earlier patcher
// accidentally duplicated.

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

let fixed = 0;
for (const file of walk(apiRoot)) {
  const src = fs.readFileSync(file, "utf8");
  // Keep only the FIRST occurrence of each export.
  const lines = src.split(/\r?\n/);
  const seen = { dynamic: false, revalidate: false };
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^export const dynamic\s*=/.test(trimmed)) {
      if (seen.dynamic) continue;
      seen.dynamic = true;
    }
    if (/^export const revalidate\s*=/.test(trimmed)) {
      if (seen.revalidate) continue;
      seen.revalidate = true;
    }
    out.push(line);
  }
  // If neither is present, append both at the end.
  let final = out.join("\n");
  if (!seen.dynamic) final += '\n\nexport const dynamic = "force-dynamic";\n';
  if (!seen.revalidate) final += 'export const revalidate = 0;\n';
  if (final !== src) {
    fs.writeFileSync(file, final, "utf8");
    fixed += 1;
    console.log("deduped:", path.relative(process.cwd(), file));
  }
}
console.log(`\n${fixed} file(s) cleaned.`);
