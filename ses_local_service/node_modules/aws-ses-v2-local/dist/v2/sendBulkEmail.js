"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("../ajv"));
const store_1 = require("../store");
const isEmailValid_1 = __importDefault(require("../isEmailValid"));
const handler = (req, res, next) => {
    if (!validate(req.body)) {
        res.status(404).send({ type: 'BadRequestException', message: 'Bad Request Exception', detail: 'aws-ses-v2-local: Schema validation failed' });
        return;
    }
    handleBulk(req, res, next);
};
const handleBulk = async (req, res) => {
    const body = req.body;
    if (!body.FromEmailAddress) {
        res.status(400).send({ type: 'BadRequestException', message: 'Bad Request Exception', detail: 'aws-ses-v2-local: Must have a from email address.' });
        return;
    }
    const fromEmailAddress = body.FromEmailAddress;
    const replyToAddresses = body.ReplyToAddresses ?? [];
    const defaultContent = body.DefaultContent;
    // Try to retrieve the template.
    const templateName = defaultContent.Template.TemplateName;
    if (!(0, store_1.hasTemplate)(templateName)) {
        res.status(400).send({ type: 'BadRequestException', message: 'Bad Request Exception', detail: `aws-ses-v2-local: Unable to find the template: ${templateName}.` });
        return;
    }
    const template = (0, store_1.getTemplate)(templateName);
    const templateSubject = template?.TemplateContent.Subject ?? '';
    const templateHtml = template?.TemplateContent.Html ?? '';
    const templateText = template?.TemplateContent.Text ?? '';
    // Default template replacement data.
    const defaultTemplateData = decodeTemplateData(defaultContent.Template?.TemplateData);
    const results = [];
    // Process each destination.
    body.BulkEmailEntries.forEach((entry, index) => {
        const messageId = `ses-${Math.floor(Math.random() * 900000000 + 100000000 + index)}`;
        // Validate destination email address.
        const allEmails = [...entry.Destination.ToAddresses, ...entry.Destination.CcAddresses ?? [], ...entry.Destination.BccAddresses ?? []];
        if (!allEmails.every(isEmailValid_1.default)) {
            results.push({
                MessageId: messageId,
                Error: 'Invalid recipient email address(es)',
                Status: 'FAILED',
            });
            return;
        }
        const templateData = decodeTemplateData(entry.ReplacementEmailContent?.ReplacementTemplate?.ReplacementTemplateData);
        const subject = replaceTemplateData(templateSubject, templateData, defaultTemplateData);
        const html = replaceTemplateData(templateHtml, templateData, defaultTemplateData);
        const text = replaceTemplateData(templateText, templateData, defaultTemplateData);
        const email = {
            messageId,
            from: fromEmailAddress,
            replyTo: replyToAddresses,
            destination: {
                to: entry.Destination.ToAddresses,
                cc: entry.Destination?.CcAddresses ?? [],
                bcc: entry.Destination?.BccAddresses ?? [],
            },
            subject,
            body: {
                html,
                text,
            },
            attachments: [],
            at: Math.floor(new Date().getTime() / 1000),
        };
        (0, store_1.saveEmail)(email);
        results.push({
            MessageId: messageId,
            Status: 'SUCCESS',
        });
    });
    res.status(200).send({ BulkEmailEntryResults: results });
};
/**
 * Decode template data.
 */
function decodeTemplateData(templateData) {
    const result = templateData ? JSON.parse(templateData) : [];
    return result ?? [];
}
/**
 * Replace template data.
 */
function replaceTemplateData(content, replacements = [], defaultReplacements = []) {
    let newContent = content;
    replacements.forEach((item) => {
        newContent = newContent.replaceAll(`{{${item.Name}}}`, item.Value);
    });
    defaultReplacements.forEach((item) => {
        newContent = newContent.replaceAll(`{{${item.Name}}}`, item.Value);
    });
    return newContent;
}
exports.default = handler;
const sendBulkEmailRequestSchema = {
    type: 'object',
    properties: {
        BulkEmailEntries: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    Destination: {
                        type: 'object',
                        properties: {
                            BccAddresses: { type: 'array', items: { type: 'string' } },
                            CcAddresses: { type: 'array', items: { type: 'string' } },
                            ToAddresses: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['ToAddresses'],
                    },
                    ReplacementEmailContent: {
                        type: 'object',
                        properties: {
                            ReplacementTemplate: {
                                type: 'object',
                                properties: {
                                    ReplacementTemplateData: { type: 'string' },
                                },
                                required: ['ReplacementTemplateData'],
                            },
                        },
                        required: ['ReplacementTemplate'],
                    },
                    ReplacementTags: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                Name: { type: 'string' },
                                Value: { type: 'string' },
                            },
                            required: ['Name', 'Value'],
                        },
                    },
                },
                required: ['Destination'],
            },
        },
        ConfigurationSetName: { type: 'string' },
        DefaultContent: {
            type: 'object',
            properties: {
                Template: {
                    type: 'object',
                    properties: {
                        TemplateArn: { type: 'string' },
                        TemplateData: { type: 'string' },
                        TemplateName: { type: 'string' },
                    },
                    required: ['TemplateName'],
                },
            },
            required: ['Template'],
        },
        DefaultEmailTags: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    Name: { type: 'string' },
                    Value: { type: 'string' },
                },
                required: ['Name', 'Value'],
            },
        },
        FeedbackForwardingEmailAddress: { type: 'string' },
        FeedbackForwardingEmailAddressIdentityArn: { type: 'string' },
        FromEmailAddress: { type: 'string' },
        FromEmailAddressIdentityArn: { type: 'string' },
        ReplyToAddresses: { type: 'array', items: { type: 'string' } },
    },
    required: ['BulkEmailEntries', 'DefaultContent', 'FromEmailAddress'],
};
const validate = ajv_1.default.compile(sendBulkEmailRequestSchema);
