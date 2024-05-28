import { INestApplication } from "@nestjs/common";
import { baseIpcHelpers } from "../helper/ipc.helper";
import { EasyMap, PromiseOut } from "@bnqkl/util-node";
import { BASE_CMD } from "../constants";

export abstract class CommonApp {
    app!: INestApplication;
    /**gipc已连接 */
    private __gipcConnectedPromiseMap = EasyMap.from({
        creater: (workerName: string) => {
            return new PromiseOut<void>();
        },
    });

    constructor() {
        process.on("message", (msg: any) => {
            if (msg.cmd === BASE_CMD.CONNECT_GIPC) {
                this.connectGipc(msg);
            }
        });
    }

    connectGipc(msg: ServerUtil.Cluster.CreateServerMessageType) {
        baseIpcHelpers.connectClient(msg.fromName, msg.address!);
        this.__gipcConnectedPromiseMap.forceGet(msg.fromName).resolve();
    }

    /**
     * 等待gipc连接
     */
    waitGipcConnect(workerName: string) {
        return this.__gipcConnectedPromiseMap.forceGet(workerName).promise;
    }

    async initIpc() {
        return await baseIpcHelpers.createServer(process.env["workerName"]!);
    }
}
