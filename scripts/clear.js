// @ts-check
const fs = require("node:fs");
const path = require("node:path");

const distPath = path.join(process.cwd(), "/dist");

if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true });
}
