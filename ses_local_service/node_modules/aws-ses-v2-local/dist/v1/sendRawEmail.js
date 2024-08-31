"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailparser_1 = require("mailparser");
const ajv_1 = __importDefault(require("../ajv"));
const store_1 = require("../store");
const handler = async (req, res) => {
    const valid = validate(req.body);
    if (!valid) {
        res.status(404).send({ message: 'Bad Request Exception', detail: 'aws-ses-v2-local: Schema validation failed' });
        return;
    }
    const messageId = `ses-${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const message = await (0, mailparser_1.simpleParser)(Buffer.from(req.body['RawMessage.Data'], 'base64'));
    const from = message.from?.text ?? req.body.Source;
    if (!from) {
        res.status(400).send({ message: 'Bad Request Exception', detail: 'aws-ses-v2-local: Missing source or from value' });
        return;
    }
    (0, store_1.saveEmail)({
        messageId,
        from,
        replyTo: message.replyTo ? [message.replyTo.text] : [],
        destination: {
            to: (Array.isArray(message.to) ? message.to : [message.to || null]).filter((m) => !!m).map((a) => a.text),
            cc: (Array.isArray(message.cc) ? message.cc : [message.cc || null]).filter((m) => !!m).map((a) => a.text),
            bcc: (Array.isArray(message.bcc) ? message.bcc : [message.bcc || null]).filter((m) => !!m).map((a) => a.text),
        },
        subject: message.subject ?? '(no subject)',
        body: {
            text: message.text,
            html: message.html || undefined,
        },
        attachments: message.attachments.map((a) => ({ ...a, content: a.content.toString('base64') })),
        at: Math.floor(new Date().getTime() / 1000),
    });
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><SendRawEmailResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/"><SendRawEmailResult><MessageId>${messageId}</MessageId></SendRawEmailResult></SendRawEmailResponse>`);
};
exports.default = handler;
const sendRawEmailRequestSchema = {
    type: 'object',
    properties: {
        Action: { type: 'string', pattern: '^SendRawEmail$' },
        Version: { type: 'string' },
        ConfigurationSetName: { type: 'string' },
        'Destinations.member.1': { type: 'string' },
        FromArn: { type: 'string' },
        'RawMessage.Data': { type: 'string' },
        ReturnPathArn: { type: 'string' },
        Source: { type: 'string' },
        SourceArn: { type: 'string' },
        'Tags.member.1': { type: 'string' },
    },
    required: ['Action', 'RawMessage.Data'],
};
const validate = ajv_1.default.compile(sendRawEmailRequestSchema);
