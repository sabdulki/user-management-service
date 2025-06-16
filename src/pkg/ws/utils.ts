import Client from "./client";
import { ErrEmptyMessage } from "./errors";
import Logger from "./logger";
import Request from "./request";

function messageRawData(client:Client, input:string) : Record<string, any> | undefined {
    let obj: Record<string, any> | undefined;
    try {
        obj = JSON.parse(input);
        if (!obj) {
            throw ErrEmptyMessage;
        }
    } catch (error) {
        Logger.error(`${client.id}\t| ${error}`);
        if (error instanceof SyntaxError) {
            error = new Error('Invalid JSON format');
        }
        client.error(`${error}`);
        return undefined;
    }
    return obj;
}

function messageRequest<T>(client:Client, obj: Record<string, any>) : Request<T> | undefined {
    let request:Request<T> | undefined
    try {
        request = new Request<T>(obj.type, obj.payload);
        if (!request) {
            throw ErrEmptyMessage
        }
    } catch (error) {
        Logger.error(`${client.id}\t| ${error}`);
        client.error(`${error}`);
        return undefined;
    }
    return request
}


export {
    messageRawData,
    messageRequest,
}