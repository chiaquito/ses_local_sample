"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailToSmtp = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter;
async function sendEmailToSmtp(email) {
    if (!process.env.SMTP_TRANSPORT || !process.env.SMTP_TRANSPORT.trim()) {
        return;
    }
    if (!transporter) {
        const config = JSON.parse(process.env.SMTP_TRANSPORT);
        transporter = nodemailer_1.default.createTransport(config);
    }
    const data = {
        messageId: email.messageId,
        from: email.from,
        to: email.destination.to,
        cc: email.destination.cc,
        bcc: email.destination.bcc,
        subject: email.subject,
        attachments: email.attachments,
    };
    if (email.body?.html) {
        data.html = email.body.html;
    }
    if (email.body?.text) {
        data.text = email.body.text;
    }
    if (email.replyTo.length > 0) {
        data.replyTo = email.replyTo;
    }
    try {
        await transporter.sendMail(data);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to send mail to SMTP server', err);
    }
}
exports.sendEmailToSmtp = sendEmailToSmtp;
