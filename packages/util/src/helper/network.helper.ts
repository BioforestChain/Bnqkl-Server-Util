import * as request from "request";
import { HTTP_TIME_OUT_INTERVAL } from "../constants";

/*
 * 发送http外部请求
 */
export class NetWorkHelper {
    private __httpHost = "";
    private __httpToken: string;

    constructor(ip: string, port: number, globalPrefix?: string) {
        this.__httpHost = `http://${ip}:${port}${globalPrefix ? (globalPrefix.startsWith("/") ? globalPrefix : `/${globalPrefix}`) : ``}`;
    }

    private __getFullUrl(apiPath: string) {
        return `${this.__httpHost}${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;
    }

    get httpToken() {
        return this.__httpToken;
    }
    set httpToken(token: string) {
        this.__httpToken = token;
    }

    private __getHeaders(isNeedToken: boolean) {
        if (isNeedToken && this.__httpToken) {
            return {
                Authorization: `Bearer ${this.__httpToken}`,
            };
        }
        return {};
    }

    /**
     * Get请求
     * @param apiPath
     * @returns
     */
    get<T, U>(apiPath: string, qs: T, isNeedToken = true) {
        return new Promise<U>((resolve, reject) => {
            try {
                request.get(
                    this.__getFullUrl(apiPath),
                    { qs, headers: this.__getHeaders(isNeedToken), timeout: HTTP_TIME_OUT_INTERVAL },
                    (err, resp, body: ServerUtil.ApiReturn) => {
                        if (err || !body) {
                            return reject(err);
                        }
                        body = JSON.parse(body as any);
                        if (!body.success) {
                            return reject(body);
                        }
                        resolve(body.result);
                    },
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Post请求
     * @param apiPath
     * @param body
     * @returns
     */
    post<T, U>(apiPath: string, body: T, isNeedToken = true) {
        return new Promise<U>((resolve, reject) => {
            try {
                request.post(
                    this.__getFullUrl(apiPath),
                    { json: body, headers: this.__getHeaders(isNeedToken), timeout: HTTP_TIME_OUT_INTERVAL },
                    (err, resp, body: ServerUtil.ApiReturn) => {
                        if (err || !body) {
                            return reject(err);
                        }
                        if (!body.success) {
                            return reject(body);
                        }
                        resolve(body.result);
                    },
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Post带二进制文件的请求
     * @param apiPath
     * @param body
     * @returns
     */
    postFile<T extends { [key: string]: any }, U>(apiPath: string, body: T, isNeedToken = true) {
        return new Promise<U>((resolve, reject) => {
            try {
                request.post(
                    this.__getFullUrl(apiPath),
                    { formData: body, headers: this.__getHeaders(isNeedToken), timeout: HTTP_TIME_OUT_INTERVAL },
                    (err, resp, body: ServerUtil.ApiReturn) => {
                        if (err || !body) {
                            return reject(err);
                        }
                        body = JSON.parse(body as any);
                        if (!body.success) {
                            return reject(body);
                        }
                        resolve(body.result);
                    },
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Put请求
     * @param apiPath
     * @param body
     * @returns
     */
    async put<T, U>(apiPath: string, body: T, isNeedToken = true) {
        return new Promise<U>((resolve, reject) => {
            try {
                request.put(
                    this.__getFullUrl(apiPath),
                    { json: body, headers: this.__getHeaders(isNeedToken), timeout: HTTP_TIME_OUT_INTERVAL },
                    (err, resp, body: ServerUtil.ApiReturn) => {
                        if (err || !body) {
                            return reject(err);
                        }
                        if (!body.success) {
                            return reject(body);
                        }
                        resolve(body.result);
                    },
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Delete请求
     * @param apiPath
     * @param qs
     * @returns
     */
    async delete<T, U>(apiPath: string, qs: T, isNeedToken = true) {
        return new Promise<U>((resolve, reject) => {
            try {
                request.delete(
                    this.__getFullUrl(apiPath),
                    { qs, headers: this.__getHeaders(isNeedToken), timeout: HTTP_TIME_OUT_INTERVAL },
                    (err, resp, body: ServerUtil.ApiReturn) => {
                        if (err || !body) {
                            return reject(err);
                        }
                        body = JSON.parse(body as any);
                        if (!body.success) {
                            return reject(body);
                        }
                        resolve(body.result);
                    },
                );
            } catch (e) {
                reject(e);
            }
        });
    }
}
