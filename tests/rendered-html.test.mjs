import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("builds the MayorFlow static application shell", async () => {
  const html = await readFile(new URL("dist/index.html", projectRoot), "utf8");
  const assets = await readdir(new URL("dist/assets/", projectRoot));

  assert.match(html, /<title>MayorFlow 市长工坊<\/title>/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /assets\/index-[^"]+\.js/i);
  assert.ok(assets.some((name) => /^index-.+\.js$/.test(name)));
  assert.ok(assets.some((name) => /^planner\.worker-.+\.js$/.test(name)));
  await access(new URL("dist/items/hammer.png", projectRoot));
});
