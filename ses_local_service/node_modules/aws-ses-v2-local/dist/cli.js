#!/usr/bin/env node
"use strict";
/* eslint-disable no-console */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = require("yargs");
const _1 = __importDefault(require("."));
const address_1 = require("./address");
// Parse the command line optional host and port arguments.
const config = {};
if (yargs_1.argv instanceof Promise) {
    throw new Error('Expected argv to be an object, not a Promise');
}
if (typeof yargs_1.argv.host === 'string' && yargs_1.argv.host.trim()) {
    config.host = yargs_1.argv.host;
}
if (typeof yargs_1.argv.port === 'number' && !Number.isNaN(yargs_1.argv.port)) {
    config.port = yargs_1.argv.port;
}
console.log('aws-ses-v2-local: starting server...');
(0, _1.default)(config)
    .then((s) => {
    console.log(`aws-ses-v2-local: server running at ${(0, address_1.getAddress)(s)}`);
})
    .catch((e) => {
    console.log('aws-ses-v2-local: failed to start server');
    console.error(e);
});
