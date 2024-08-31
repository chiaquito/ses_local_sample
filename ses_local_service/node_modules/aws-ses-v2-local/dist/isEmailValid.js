"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// From https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type%3Demail)
function isEmailValid(address) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(address);
}
exports.default = isEmailValid;
