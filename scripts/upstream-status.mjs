import fs from "node:fs/promises";

const manifest = JSON.parse(
  await fs.readFile(new URL("../upstream/versions.json", import.meta.url), "utf8"),
);

for (const [name, item] of Object.entries(manifest)) {
  console.log(`${name}: ${item.ref} (${item.integration})`);
  console.log(`  ${item.repository}`);
}
