const fs = require("fs")

async function createTicket(templatePath, ticketData) {
    try {
        let ticket = await readTemplate(templatePath);
        for (let i in ticketData) {
            ticket = ticket.replace(`{{${i}}}`, ticketData[i]);
        }
        return ticket
    } catch (err) {
        console.log(err)
        throw err
    }
}

const readTemplate = async (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf-8", (err, data) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });
};

module.exports = {
    createTicket,
};