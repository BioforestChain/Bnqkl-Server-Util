import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Observable} from "rxjs";
import { map } from "rxjs";

export class Result<T> {
    success!: boolean;
    result?: T | undefined;
    error?: { code: number; message: string };

    ok(result?: T, success = true) {
        this.success = success;
        this.result = result;
        return this;
    }

    err(code = 1, message = "failed", success = false) {
        this.success = success;
        this.error = {
            code: code,
            message: message,
        };
        return this;
    }
}

@Injectable()
export class CommonTransformIterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        return next.handle().pipe(
            map((data) => {
                // 额外情况处理
                if (data?.Error) {
                    throw Error(data.Error);
                }
                if (data?.success !== undefined) {
                    return data;
                } else {
                    return new Result().ok(data);
                }
            }),
        );
    }
}
