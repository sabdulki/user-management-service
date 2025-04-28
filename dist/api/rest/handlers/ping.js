"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingHandler = pingHandler;
const storage_1 = require("../../../infrastructure/storage/storage");
async function pingHandler(request, reply) {
    const storage = new storage_1.Storage();
    const result = await storage.testRequestToDB();
    return { pong: result };
}
