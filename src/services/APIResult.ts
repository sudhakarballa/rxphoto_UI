
export class APIResult {
    public isError: boolean;
    public message: string;
    public result: any;
    public statusCode: number;
    public responseException: ResponseException;

    constructor (isError: boolean = false,
                 message: string = null as any,
                 result: any,
                 statusCode: number = 200,
                 responseException: ResponseException = null as any) {
        this.isError = isError;
        this.message = message;
        this.result = result;
        this.statusCode = statusCode;
        this.responseException = responseException;
    }
}

export class ResponseException {
    exceptionMessage: string; 
    referenceErrorCode: string;
    payload: any;

    constructor (exceptionMessage: string = null as any,
        error: string = null as any,
        payload: any) {
        this.exceptionMessage = exceptionMessage;
        this.referenceErrorCode = error;
        this.payload = payload;
    }
}