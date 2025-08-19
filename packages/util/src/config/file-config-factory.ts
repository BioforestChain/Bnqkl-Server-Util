import * as fs from "node:fs";
import { $assign } from "../helper/index.js";

abstract class FileConfigFactory<T extends {}> {
    private _configData?: T;
    protected get _rootPath() {
        return process.env.ROOT_PATH ? process.env.ROOT_PATH : process.cwd();
    }
    protected abstract readonly _configPath: string;
    protected abstract _parseToConfig(content: Buffer): T;
    protected abstract _stringifyFromConfig(config: T): Buffer | string;

    getConfig() {
        return (this._configData ??= this._parseToConfig(fs.readFileSync(this._configPath)));
    }

    /**
     * 修改配置文件
     * @param config
     * @param writeFile
     * @param force
     */
    setConfig(config: Partial<T>, writeFile?: boolean, force = false) {
        const newConfig = force ? (config as T) : $assign(this.getConfig(), config);
        console.log(`setConfig emit ${process.env["workerName"]}`);
        if (writeFile) {
            fs.writeFileSync(this._configPath, this._stringifyFromConfig(newConfig));
        }
    }
}
export abstract class JsonFileConfigFactory<T extends {}> extends FileConfigFactory<T> {
    protected _parseToConfig(content: Buffer): T {
        return JSON.parse(content.toString()) as T;
    }
    protected _stringifyFromConfig(config: T): Buffer | string {
        return JSON.stringify(config, null, 4);
    }
}
