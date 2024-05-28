import { BASE_CMD } from "../constants";

export {};
declare global {
    export namespace ServerUtil {
        export namespace Cluster {
            export interface CommonCMDType {
                cmd: BASE_CMD;
            }
            export interface CreateServerMessageType extends CommonCMDType {
                address: string | import("net").AddressInfo | null;
                fromName: string;
                to: string;
            }

            export type ReqRes<Q = any, R = any> = { request: Q; response: R };
            export type ReqResAsync<Q = any, R = any> = ReqRes<Q, import("@bnqkl/util-node").$PromiseMaybe<R>>;

            export type IPC_Request = { [key: string]: ReqResAsync };
            type GetRequest<K extends keyof T, T> = T[K] extends ReqResAsync ? T[K]["request"] : never;
            type GetResponse<K extends keyof T, T> = T[K] extends ReqResAsync ? T[K]["response"] : never;
        }
    }
}
