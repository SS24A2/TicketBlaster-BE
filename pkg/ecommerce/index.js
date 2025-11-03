const mongoose = require("mongoose");

const { EventModel } = require("../events");
const { UserModel } = require("../users");

const ticketSchema = new mongoose.Schema({
    eventId: { type: mongoose.SchemaTypes.ObjectId, ref: EventModel },
    attendeeId: { type: mongoose.SchemaTypes.ObjectId, ref: UserModel },
    status: { type: String, enum: ["available", "reserved", "sold"] },
    reservationExpiry: { type: Number }  //check Type
}, { timestamps: true });


const TicketModel = mongoose.model("Ticket", ticketSchema);

const createTickets = async ({ eventId, numOfTickets }) => {
    try {
        let tickets = []
        for (let i = 0; i < numOfTickets; i++) {
            tickets.push({ eventId, status: "available" })
        }
        const res = await TicketModel.insertMany(tickets)
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}

const checkAvailableTicketsForOneEvent = async (eventId) => {
    try {
        const dateNow = Math.floor(Date.now() / 1000)
        const res = await TicketModel.find({ eventId, $or: [{ status: "available" }, { $and: [{ status: "reserved" }, { reservationExpiry: { $lt: dateNow } }] }] })
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}

const checkAvailableTicketsForMultipleEvents = async (selectedTickets) => {
    //selectedTickets = {event1ID:numOfTicketsForEvent1, event2ID: numOfTicketsForEvent2} ex. {68bd76e9cf8fbb007f50b15b:5, 68bd76e9cf8fbb007f50b15n:3}
    try {
        const eventsIdArray = Object.keys(selectedTickets)
        const dateNow = Math.floor(Date.now() / 1000)
        let availableTickets = {}
        let unavailableEvents = []

        for (let event of eventsIdArray) {
            availableTickets[event] = await TicketModel.find({ eventId: event, $or: [{ status: "available" }, { $and: [{ status: "reserved" }, { reservationExpiry: { $lt: dateNow } }] }] }).populate("eventId").limit(selectedTickets[event])
            if (availableTickets[event].length === 0) {
                const unavailableEvent = await EventModel.findOne({ _id: event })
                unavailableEvents.push(unavailableEvent)
            }
        }
        return { availableTickets, unavailableEvents }// {id111:[ticket1Obj, ticket2Obj, ticket3Obj], id222:[ticket1Obj, ticket2Obj, ticket3Obj]}
    } catch (err) {
        console.error(err)
        throw err
    }
}

const reserveTicketsDuringCheckout = async ({ userId, ticketsIdArray }) => {
    try {
        const setExpiryTime = () => {
            return Math.floor(Date.now() / 1000) + (10 * 60) // 10min od rezervacija
        }
        const dateNow = Math.floor(Date.now() / 1000)
        const res = await TicketModel.updateMany({ _id: { $in: ticketsIdArray }, $or: [{ status: "available" }, { $and: [{ status: "reserved" }, { reservationExpiry: { $lt: dateNow } }] }] }, { status: "reserved", attendeeId: userId, reservationExpiry: setExpiryTime() }, { runValidators: true })
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}

const buyReservedTickets = async ({ userId, ticketsIdArray }) => {
    try {
        const dateNow = Math.floor(Date.now() / 1000)
        const res = await TicketModel.updateMany({ $and: [{ _id: { $in: ticketsIdArray } }, { attendeeId: userId }, { status: "reserved" }, { reservationExpiry: { $gte: dateNow } }] }, { status: "sold" }, { runValidators: true })
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}

const viewPurchasedTickets = async (userId, search) => {
    try {
        let tickets = await TicketModel.find({ status: "sold", attendeeId: userId }).populate("eventId")

        if (search) {
            const regex = new RegExp(search, "i");
            tickets = tickets.filter(t => regex.test(t.eventId.name) || regex.test(t.eventId.details))
        }

        const events = tickets.map(t => t.eventId).filter((obj, index, self) =>
            index === self.findIndex((e) => e._id === obj._id)).sort((a, b) => b.date - a.date)

        const ticketsIds = tickets.map(t => t._id)
        return { events, ticketsIds }
    } catch (err) {
        console.error(err)
        throw err
    }
}


const cancelReservedTickets = async (userId) => {
    try {
        const res = await TicketModel.updateMany({ $and: [{ attendeeId: userId }, { status: "reserved" }] }, { status: "available" }, { runValidators: true })
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}



const getTicketsToPrint = async (ticketsIdsArray) => {
    try {
        const res = await TicketModel.find({ _id: { $in: ticketsIdsArray } }).populate("eventId")
        return res
    } catch (err) {
        console.error(err)
        throw err
    }
}

module.exports = { createTickets, checkAvailableTicketsForOneEvent, checkAvailableTicketsForMultipleEvents, reserveTicketsDuringCheckout, buyReservedTickets, viewPurchasedTickets, cancelReservedTickets, getTicketsToPrint } 
