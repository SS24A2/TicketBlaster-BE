const ejs = require("ejs")
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const config = require("../config");

const mailgun = new Mailgun(formData);
let mg = null

const fsPromises = require('fs').promises;
const { createAllTickets } = require("../tickets/createAllTickets")

const mailTemplates = {
    PASSWORD_RESET: {
        title: "Password Reset",
        template: "mail-reset-password.ejs",
    },
    WELCOME: {
        title: "Welcome to our website",
        template: "welcome.ejs",
    },
    TICKETS: {
        title: "Your Ticket Purchase Is Complete!",
        template: "tickets.ejs",
    },
    VERIFICATION: {
        title: "TicketBlaster - Verify your email adress",
        template: "verification-mail.ejs",
    }
};

const sendMail = async (to, type, data, ticketsIdArray) => {
    try {
        if (!mg) {
            mg = mailgun.client({ username: "api", key: config.getSection("mailgun").api_key })
        }

        const title = mailTemplates[type].title;
        const templatePath = `${__dirname}/../../pkg/mailer/email_templates/${mailTemplates[type].template}`

        let content = null
        content = await ejs.renderFile(templatePath, { data })

        let messageParams = {
            from: `${config.getSection("mailgun").sender_email} <mailgun@${config.getSection("mailgun").domain}>`,
            to: to,
            subject: title,
            html: content,
        }

        if (type === "TICKETS") {
            const tickets = await createAllTickets(ticketsIdArray)

            let attachments = []
            for (let i = 0; i < tickets.length; i++) {
                attachments.push({ filename: `Ticket_No.${i + 1}-${tickets[i].eventName.replace(/ /g, "_")}.html`, data: tickets[i].ticket })
            }
            messageParams.attachment = attachments;

            const imageFile = await fsPromises.readFile(`${__dirname}/email_templates/logo.png`)
            const file = { filename: 'logo.png', data: imageFile }
            messageParams.inline = file;
        }

        if (type === "PASSWORD_RESET" || type === "VERIFICATION") {
            const imageFile = await fsPromises.readFile(`${__dirname}/email_templates/logo_white.png`)
            const file = { filename: 'logo.png', data: imageFile }
            messageParams.inline = file;
        }

        if (type === "WELCOME") {
            const ticketBlasterLogo = await fsPromises.readFile(`${__dirname}/email_templates/logo_white.png`)
            const file1 = { filename: 'logo.png', data: ticketBlasterLogo }
            const facebookLogo = await fsPromises.readFile(`${__dirname}/email_templates/facebook.png`)
            const file2 = { filename: 'facebook.png', data: facebookLogo }
            const instagramLogo = await fsPromises.readFile(`${__dirname}/email_templates/instagram.png`)
            const file3 = { filename: 'instagram.png', data: instagramLogo }
            messageParams.inline = [file1, file2, file3];
        }

        return await mg.messages.create(config.getSection("mailgun").domain, messageParams);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    sendMail,
};
