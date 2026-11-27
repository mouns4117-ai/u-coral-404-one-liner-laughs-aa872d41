// One-Liner Laughs — make.fun entry program.
// Validates the gate (1-200 chars, single line, non-whitespace, UTF-8),
// empties /output contents only, writes entry.txt, sha256-verifies by read-back.

import { createHash } from "node:crypto";
import { readdirSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";

const ENTRY =
  "I told my smart fridge to chill \u2014 now it gives me the cold shoulder every time I open it at midnight.";

function validateGate(line: string): void {
  const chars = [...line];
  if (chars.length < 1 || chars.length > 200) {
    throw new Error(`gate: entry must be 1-200 characters, got ${chars.length}`);
  }
  if (line.trim().length === 0) throw new Error("gate: entry must not be only whitespace");
  if (line !== line.trim()) throw new Error("gate: entry must not have leading or trailing whitespace");
  if (line.split(/\s+/).length < 3) throw new Error("gate: entry must be a real line, not a bare fragment");
  if (line.includes("\n") || line.includes("\r")) throw new Error("gate: entry must be a single line");
  if (line.startsWith("\uFEFF")) throw new Error("gate: entry must not start with a BOM");
  for (const ch of line) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 && ch !== "\t") throw new Error("gate: entry must not contain control characters");
  }
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length > 800) throw new Error("gate: entry exceeds 800 bytes");
  if (Buffer.from(bytes.toString("utf8"), "utf8").toString("utf8") !== line) {
    throw new Error("gate: entry failed UTF-8 round-trip");
  }
}

validateGate(ENTRY);

// Empty ONLY the contents of /output (it is a mounted dir: never remove it).
mkdirSync("/output", { recursive: true });
for (const name of readdirSync("/output")) {
  rmSync(`/output/${name}`, { recursive: true, force: true });
}

writeFileSync("/output/entry.txt", ENTRY, "utf8");
const back = readFileSync("/output/entry.txt", "utf8");
if (back !== ENTRY) throw new Error("read-back mismatch: entry.txt does not hold exactly the entry");
const sha = createHash("sha256").update(back, "utf8").digest("hex");
console.log(`wrote /output/entry.txt (${[...ENTRY].length} chars, ${Buffer.byteLength(ENTRY, "utf8")} bytes, sha256 ${sha})`);
console.log("entry:", ENTRY);
