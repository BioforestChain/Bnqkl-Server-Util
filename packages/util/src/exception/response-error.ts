export class ResponseError {
    constructor(
        errorCode: {
            code: number | undefined;
            message: string;
        },
        public status: number = 200,
        readonly code = errorCode.code,
        readonly message = errorCode.message,
    ) {}

    getStatus() {
        return this.status;
    }
}
