import { ErrMissedPayloadField, ErrMissedTypeField } from "./errors";

export default class WebSocketRequest <T> {
    public readonly type: T;
    public readonly payload: any;

    constructor(type: T, payload: any) {
        this.type = type;
        if (type === undefined || type == null) {
            throw ErrMissedTypeField;
        }
        this.payload = payload;
        // if (payload === undefined || payload === null) {
        //     throw ErrMissedPayloadField;
        // }
    }

    public toJSON(): string {
        return JSON.stringify({
            type: this.type,
            payload: this.payload
        });
    }
}