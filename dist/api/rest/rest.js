"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRestRoutes = registerRestRoutes;
const ping_1 = require("./handlers/ping");
const registration_1 = require("./handlers/registration");
const routes = [
    {
        method: 'GET',
        route: '/ping',
        handler: ping_1.pingHandler
    },
    {
        method: 'POST',
        route: '/auth/api/rest/registration',
        handler: registration_1.registrationHandler
    }
];
async function registerRestRoutes(app) {
    for (const route of routes) {
        app.route({
            method: route.method,
            url: route.route,
            handler: route.handler
        });
    }
}
