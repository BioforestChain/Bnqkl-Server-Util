import { IPC_Client, IPC_Server } from "@bnqkl/ipc";
import { ipcReqAsync, registerIpcRes } from "@bnqkl/ipc-request";
import { PromiseOut } from "@bnqkl/util-node";
import { AddressInfo } from "net";
import { BASE_CMD } from "../constants";
import { Logger } from "../log4j/log4j";

export class IPCHelpers<T = ServerUtil.Cluster.IPC_Request> {
    private addressPromise?: PromiseOut<string | AddressInfo>;
    private server?: IPC_Server;

    async createServer(name: string, connectTo?: string) {
        if (this.addressPromise) {
            await this.addressPromise.promise;
            return this.server;
        } else {
            try {
                this.addressPromise = new PromiseOut();
                this.server = new IPC_Server(IPC_Server.generateUUID(process.pid, name));
                const address = await this.server.listen();
                this.addressPromise.resolve(address!);
                const data: ServerUtil.Cluster.CreateServerMessageType = {
                    address,
                    fromName: name,
                    cmd: BASE_CMD.CREATE_SERVER_ADDRESS,
                    to: connectTo || "*",
                };
                process.send!(data);
                return this.server;
            } catch (err) {
                Logger.error(err);
                this.addressPromise!.reject(err);
            }
        }
    }

    private _clientMap = new Map<string, IPC_Client>();

    async connectClient(name: string, address: string | AddressInfo) {
        const client = this._clientMap.get(name);
        if (client) {
            return client;
        } else {
            const c = new IPC_Client(address);
            // Logger.info(`${process.env["workerName"]}.. connect>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${name}~ `);
            this._clientMap.set(name, c);
            return c;
        }
    }

    async request<K extends keyof T>(name: string, cmd: K, data: ServerUtil.Cluster.GetRequest<K, T>): Promise<ServerUtil.Cluster.GetResponse<K, T>> {
        const client = this._clientMap.get(name);
        if (client) {
            return ipcReqAsync(client, cmd, data);
        } else {
            throw Error(`can not find client ${name}`);
        }
    }

    register<K extends keyof T>(
        server: IPC_Server,
        cmd: K,
        func: (header: any, body: ServerUtil.Cluster.GetRequest<K, T>) => ServerUtil.Cluster.GetResponse<K, T>,
    ) {
        registerIpcRes(server, cmd as string, func);
    }
}

export const baseIpcHelpers = new IPCHelpers();
