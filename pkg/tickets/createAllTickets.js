const { createTicket } = require("./createTicket");
const { getTicketsToPrint } = require("../ecommerce/index");
const fs = require("fs")

const qrCodePath = `${__dirname}/../../pkg/tickets/tickets_general_images/qr_code.png`
const logoPath = `${__dirname}/../../pkg/tickets/tickets_general_images/logo.png`
const noImagePath = `${__dirname}/../../pkg/tickets/tickets_general_images/Image-not-found.png`
const templatePath = `${__dirname}/../../pkg/tickets/tickets_templates/ticket.html`

async function generateImageSrc(path) {
    try {
        let imageBuffer = await readImage(path);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = `image/png`;
        const dataUri = `data:${mimeType};base64,${base64Image}`;
        return dataUri
    } catch (err) {
        console.log(err)
        throw err
    }
}

async function createAllTickets(ticketsIdArray) {
    try {
        const DirPath = `${__dirname}/../../uploads_events`;
        const filesList = fs.readdirSync(DirPath)

        const logoSrc = await generateImageSrc(logoPath)
        const qrCodeSrc = await generateImageSrc(qrCodePath)
        const noImageSrc = await generateImageSrc(noImagePath)

        const arrayOfTicketObjects = await getTicketsToPrint(ticketsIdArray)

        let ticketsFiles = []
        for (let ticket of arrayOfTicketObjects) {

            let eventImgPath = null
            if (filesList.length > 0) {
                eventImgPath = filesList.find(item => item.slice(0, 24) === ticket.eventId._id.toString()) || null
            }
            let eventImage = null
            if (eventImgPath) {
                eventImage = await generateImageSrc(`${DirPath}/${eventImgPath}`)
            }
            eventImage = eventImage ? eventImage : noImageSrc

            const date = ticket.eventId.date.toDateString().split(' ').slice(1).join(' ')

            let ticketFile = await createTicket(templatePath, { title: `${ticket.eventId.name}-Ticket code:${ticket._id}`, logo: logoSrc, eventImg: eventImage, eventName: ticket.eventId.name, eventDate: date, eventLocation: ticket.eventId.location, qrCode: qrCodeSrc, ticketId: ticket._id })
            ticketsFiles.push({ eventId: ticket.eventId._id, eventName: ticket.eventId.name, ticket: ticketFile, })
        }
        return ticketsFiles //niza od objekti sto sodrzat info za koj event e tiketot i samiot ticket file
    } catch (err) {
        console.log(err)
        throw err
    }
}

const readImage = async (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "base64", (err, data) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });
};

module.exports = { createAllTickets }