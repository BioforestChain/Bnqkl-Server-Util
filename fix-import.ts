/**
 * from "(\..*)"
 * from "$1.js"
 */
import fs from "node:fs";
import path from "node:path";
for (const tsfile of fs.globSync("packages/*/src/**/*.ts")) {
    let fileContent = fs.readFileSync(tsfile, "utf-8");
    for (const m of fileContent.matchAll(/from "(\..*\.js)"/g)) {
        const importTsfilepath = path.resolve(tsfile, "../", m[1].replace(".js", ".ts"));
        if (!fs.existsSync(importTsfilepath)) {
            const indexFilepath = path.resolve(tsfile, "../", m[1].replace(".js", "/index.ts"));
            if (fs.existsSync(indexFilepath)) {
                fileContent = fileContent.replaceAll(m[0], `from "${m[1].replace(".js", "/index.js")}"`);
                console.log("fix import", m[1]);
            }
        }
    }
    fs.writeFileSync(tsfile, fileContent);
}
