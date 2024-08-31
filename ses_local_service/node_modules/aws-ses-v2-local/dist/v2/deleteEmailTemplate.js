"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("../store");
const handler = (req, res) => {
    const templateName = req.params.TemplateName;
    // Check if the template already exists.
    if (!(0, store_1.hasTemplate)(templateName)) {
        res.status(404).send({ type: 'NotFoundException', message: 'The resource you attempted to access doesn\'t exist.' });
        return;
    }
    (0, store_1.deleteTemplate)(templateName);
    res.status(200).send();
};
exports.default = handler;
