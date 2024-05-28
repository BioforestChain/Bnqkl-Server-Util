import cluster, { Worker } from "cluster";
import { sleep } from "../helper";
import { Logger } from "../log4j/log4j";
import { redisCore } from "../redis";
import { BASE_CMD, GLOBAL_INITING, LOG4JS_INSTANCE } from "../constants";

export abstract class CommonMaster {
    private __workerMap = new Map<string, Worker>();
    constructor() {}

    onMessage() {
        cluster.on("message", (worker, msg) => {
            if (msg.cmd === BASE_CMD.CREATE_SERVER_ADDRESS) {
                /**这里根据 msg.to 解析连接 */
                const to = msg.to as string | undefined;
                const fromName = msg.fromName as string;
                const address = msg.address as string;
                if (to) {
                    if (to === "*") {
                        for (const [name, worker] of this.__workerMap) {
                            if (name !== fromName) {
                                worker.send({ cmd: BASE_CMD.CONNECT_GIPC, address, fromName });
                            }
                        }
                    } else {
                        const tos = to.split(",");
                        /**@TODO 有需要的时候再实现 */
                    }
                } else {
                    Logger.error("error msg", msg);
                }
            }
        });
    }

    forkWorker(path: string, workerName: string) {
        cluster.setupPrimary({
            silent: false,
            exec: path,
        });

        const worker = cluster.fork({ workerName, [LOG4JS_INSTANCE]: "0" });
        worker.on("exit", (code, signal) => {
            if (signal) {
                Logger.error(`worker ${workerName} was killed by signal ${signal}`);
            } else if (code !== 0) {
                Logger.error(`worker ${workerName} exited with error code ${code}`);
            } else {
                Logger.info(`kill worker ${workerName} success`);
            }
        });

        this.__workerMap.set(workerName, worker);
        return worker;
    }

    async waitGlobalInited() {
        while (true) {
            const isGlobalIniting = await redisCore.redis.get(GLOBAL_INITING);
            if (!isGlobalIniting) {
                break;
            }
            await sleep(1000);
        }
        Logger.info("global init done!");
    }
}
