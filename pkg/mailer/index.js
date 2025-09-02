const ejs = require("ejs")
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const config = require("../config");

const mailgun = new Mailgun(formData);
let mg = null

const mailTemplates = {
    PASSWORD_RESET: {
        title: "Your password reset link has been generated",
        template: "mail-reset-password.ejs",
    },
    WELCOME: {
        title: "Welcome to our website",
        template: "welcome.ejs",
    },
};

// sendMail("123@gmail.com", "WELCOME", { first_name: "123", last_name: "123", email: "123@gmail.com" });
// sendMail("123@gmail.com", "PASSWORD_RESET", { username: "123", link: "http://test.com" });

const sendMail = async (to, type, data) => {
    try {
        if (!mg) {
            mg = mailgun.client({ username: "api", key: config.getSection("mailgun").api_key })
        }

        const title = mailTemplates[type].title;
        const templatePath = `${__dirname}/../../pkg/mailer/email_templates/${mailTemplates[type].template}`

        let content = null
        content = await ejs.renderFile(templatePath, { ...data })  //TBC!!

        return await mg.messages.create(config.getSection("mailgun").domain, {
            from: `${config.getSection("mailgun").sender_email} <mailgun@${config.getSection("mailgun").domain}>`,
            to: to,
            subject: title,
            html: content,
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    sendMail,
};
