"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("../ajv"));
const store_1 = require("../store");
const handler = (req, res) => {
    const valid = validate(req.body);
    if (!valid) {
        res.status(404).send({ type: 'BadRequestException', message: 'Bad Request Exception', detail: 'aws-ses-v2-local: Schema validation failed' });
        return;
    }
    const template = req.body;
    // Check if the template already exists.
    if ((0, store_1.hasTemplate)(template.TemplateName)) {
        res.status(400).send({ type: 'AlreadyExistsException', message: 'The resource specified in your request already exists.' });
        return;
    }
    (0, store_1.setTemplate)(template.TemplateName, template);
    res.status(200).send();
};
exports.default = handler;
const templateSchema = {
    type: 'object',
    properties: {
        TemplateContent: {
            type: 'object',
            properties: {
                Html: { type: 'string' },
                Subject: { type: 'string' },
                Text: { type: 'string' },
            },
            required: ['Subject'],
        },
        TemplateName: { type: 'string' },
    },
    required: ['TemplateContent', 'TemplateName'],
};
const validate = ajv_1.default.compile(templateSchema);
