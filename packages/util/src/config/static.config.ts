import * as path from "path";
import { JsonFileConfigFactory } from "./file-config-factory";

export const CONFIG_PARAM = {
    PATH: Symbol("PATH"),
};

export class StaticConfigFactory<T extends {}> extends JsonFileConfigFactory<T> {
    private __path?: string;

    constructor(path?: string) {
        super();
        this.__path = path;
    }

    protected get _configPath() {
        return path.join(this._rootPath, this.__path ?? "config/serverConfig.json");
    }

    /**
     * 获取静态配置（不放入redis动态更新的）
     *
     * @returns
     */
    getStaticConfig(): T {
        return super.getConfig();
    }
}
