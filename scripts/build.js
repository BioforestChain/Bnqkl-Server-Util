// @ts-check
const os = require("os");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const log = require("debug")("metabox:build");
log.enabled = true;
const runPlatform = process.argv[2] || os.platform();
log(`run platform: ${runPlatform}`);

// @ts-ignore
// const esbuild = require("esbuild");
const all = process.argv.find((arg) => arg === "--all");
const linux = process.argv.find((arg) => arg === "--linux");
const win32 = process.argv.find((arg) => arg === "--win");
const test = process.argv.find((arg) => arg === "--test");
let packagesSet = new Set();
if (test) {
    packagesSet.add("packages/test");
}
else{
    packagesSet.add("packages/wallet");
}
const platforms = new Set();
if (linux) {
    platforms.add("linux");
}
if (win32) {
    platforms.add("win32");
}
if (all) {
    platforms.add("linux");
    platforms.add("win32");
    platforms.add("darwin");
}

/**
 * 更改 package.json 内容
 *
 */
function changePackageJson(entryPath) {
    // 备份原有的 package.json
    const baseDir = entryPath;
    const packageJsonPath = path.resolve(baseDir, "package.json");
    const packageJsonBackupPath = path.resolve(baseDir, "package_backup.json");
    log(`start to change package.json ...`);
    const defaultPackageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
    // 备份 packageJson
    fs.writeFileSync(packageJsonBackupPath, JSON.stringify(defaultPackageJson, null, 4) + "\n");
    const content = JSON.parse(fs.readFileSync(packageJsonPath).toString());
    if (defaultPackageJson.bin) {
        content.main = `${defaultPackageJson.bin}`;
    }
    content.bin = `${defaultPackageJson.bin}`;
    content.pkg.scripts = [`**/*.js`].sort();
    content.pkg.assets = ["documentation/*.html", "../../node_modules/swagger-ui-dist/*.*"].sort();

    delete content.license;
    delete content.dependencies;
    delete content.devDependencies;
    delete content.optionalDependencies;
    fs.writeFileSync(packageJsonPath, JSON.stringify(content, null, 4));
    log(`finish to change package.json ...`);
}

/**
 * 恢复 package.json 内容
 *
 */
function restorePackageJson(entryPath) {
    const baseDir = entryPath;
    const packageJsonPath = path.resolve(baseDir, "package.json");
    const packageJsonBackupPath = path.resolve(baseDir, "package_backup.json");
    log(`start to restore package.json ...`);
    fs.writeFileSync(packageJsonPath, fs.readFileSync(packageJsonBackupPath));
    fs.unlinkSync(packageJsonBackupPath);
    log(`finish to restore package.json ...`);
}

/**
 * pkg 打包成二进制文件
 *
 */
function pkg(platform, package) {
    if (platform === "node") {
        return;
    }
    const pkgTargets = process.argv.find((arg) => arg.startsWith("-t="));

    if (pkgTargets) {
        //优先根据命令行参数决定包的平台
        childProcess.execSync(
            `pkg ${package}/package.json -o ${package.substring(9)}-server -t ${pkgTargets.slice(3)} --options "max_old_space_size=8192,no_deprecation"`,
            {
                stdio: ["inherit", "inherit", "pipe"],
            },
        );
        return;
    }
    switch (platform) {
        case "linux":
            childProcess.execSync(
                `pkg ${package}/package.json -o ${package.substring(9)}-server -t node16-linux-x64 --options "max_old_space_size=8192,no_deprecation"`,
                {
                    stdio: ["inherit", "inherit", "pipe"],
                },
            );
            break;
        case "darwin":
            childProcess.execSync(
                `pkg ${package}/package.json -o ${package.substring(9)}_server -t node16-mac-x64 --options "max_old_space_size=8192,no_deprecation"`,
                {
                    stdio: ["inherit", "inherit", "pipe"],
                },
            );
            break;
        case "win32":
            childProcess.execSync(
                `pkg ${package}/package.json -o ${package.substring(9)}-server -t node16-win-x64 --options "max_old_space_size=8192,no_deprecation"`,
                {
                    stdio: ["inherit", "inherit", "pipe"],
                },
            );
            break;
        default:
            break;
    }
}

(async () => {
    const packages = [...packagesSet.values()];
    for (const package of packages) {
        try {
            // 改写 package.json
            changePackageJson(package);

            for (const platform of platforms.keys()) {
                console.log(`platform: ${platform}`);

                // 打包二进制文件
                pkg(platform, package);
            }
        } catch (error) {
            log(error);
        } finally {
            // 还原 package.json
            restorePackageJson(package);
        }
    }
})();
