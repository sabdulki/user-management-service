
/* PARSING CLIENT MESSAGE ERRORS */

const ErrEmptyMessage = new Error('Invalid message format, empty message')
const ErrMissedTypeField = new Error('Invalid message format, missed "type" field')
const ErrMissedPayloadField = new Error('Invalid message format, missed "payload" field')
const ErrUndefinedMessage = new Error('Invalid message format, undefined message')

export {
    ErrEmptyMessage,
    ErrMissedTypeField,
    ErrMissedPayloadField,
    ErrUndefinedMessage,
}