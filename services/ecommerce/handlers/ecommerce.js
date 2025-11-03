const { checkAvailableTicketsForOneEvent, checkAvailableTicketsForMultipleEvents, reserveTicketsDuringCheckout, buyReservedTickets, viewPurchasedTickets, cancelReservedTickets, getTicketsToPrint } = require("../../../pkg/ecommerce");
const { sendMail } = require("../../../pkg/mailer");
const { createAllTickets } = require("../../../pkg/tickets/createAllTickets")
const fs = require("fs");

const checkAvailableTicketsForEvent = async (req, res) => {
  try {
    const response = await checkAvailableTicketsForOneEvent(req.params.id)
    const numberOfAvailableTickets = response.length
    return res.status(200).send(numberOfAvailableTickets)
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error")
  }
}

const selectCheckout = async (req, res) => {
  try {
    const { selectedTickets } = req.body   //selectedTickets ex. {68bd76e9cf8fbb007f50b15b:5, 68bd76e9cf8fbb007f50b15n:3}
    if (!selectedTickets) {
      return res.status(400).send({ error: `Your cart is temporarily unavailable. Try again later.` })
    }
    if (!(Object.keys(selectedTickets).length > 0)) {
      return res.status(400).send({ error: `You don't have any events in your cart. Make sure you have events added in your cart before checkout.` })
    }
    for (let event in selectedTickets) {
      if (!(selectedTickets[event] > 0)) {
        return res.status(400).send({ error: `Nonvalid number of tickets is detected in your cart. Check your cart and remove any event with nonvalid number of tickets. Add the event to your cart again and retry checkout.` })
      }
    }

    const { availableTickets, unavailableEvents } = await checkAvailableTicketsForMultipleEvents(selectedTickets)
    // availableTickets = {68bd76e9cf8fbb007f50b15b:[ticket1Obj, ticket2Obj, ticket3Obj], 68bd76e9cf8fbb007f50b15n:[ticket1Obj, ticket2Obj, ticket3Obj]}
    // unavailableEvents = [68bd76e9cf8fbb007f50b15v, 68bd76e9cf8fbb007f50b157]

    if (!availableTickets || !unavailableEvents) {
      return res.status(500).send({ error: `Internal Server Error` })
    }
    if (!(Object.keys(availableTickets).length > 0)) {
      return res.status(500).send({ error: `Internal Server Error` })
    }

    if (Object.keys(availableTickets).length === unavailableEvents.length) {
      return res.status(400).send({ error: `No tickets available! Try again later.` })
    }

    if (unavailableEvents.length > 0) {
      const eventsNames = unavailableEvents.map(e => e.name).join(", ")
      return res.status(400).send({ error: `No tickets available for ${unavailableEvents.lenght > 1 ? "events" : "event"}: ${eventsNames}! Try again later or remove ${unavailableEvents.lenght > 1 ? "these events" : "this event"} from your cart before checkout.`, events: unavailableEvents })
    }

    for (let event in availableTickets) {
      const dateNow = new Date()
      if (availableTickets[event][0].eventId.date < dateNow) {
        return res.status(400).send({ error: `The event ${availableTickets[event][0].eventId.name} has already occurred! Remove this event from your cart.`, event: availableTickets[event][0].eventId })
      }

      if (availableTickets[event].length < selectedTickets[event]) {
        return res.status(400).send({ error: `The required number of tickets for event ${availableTickets[event][0].eventId.name} is not available.Only ${availableTickets[event].length} ticket / tickets available. Try again later or reduce the number of tickets for this event before checkout.`, event: availableTickets[event][0].eventId })
      }
    }

    let arrayOfAllTickets = []
    for (let event in availableTickets) {
      arrayOfAllTickets.push(availableTickets[event])
    }
    arrayOfAllTickets = arrayOfAllTickets.flat()

    const arrayOfTicketsIDs = arrayOfAllTickets.map(ticket => ticket._id)

    const response = await reserveTicketsDuringCheckout({ userId: req.headers.id, ticketsIdArray: arrayOfTicketsIDs })
    if (response.modifiedCount !== arrayOfTicketsIDs.length) {
      await cancelReservedTickets(req.headers.id) //cancel the partially reserved tickets so the user can try again making reservation for all tickets
      return res.status(400).send({ error: `Check out failed, please try again.` })
    }
    return res.status(200).send(arrayOfTicketsIDs)
  } catch (err) {
    console.error(err);
    if (err.name === "CastError") {
      return res.status(400).send({ error: "Invalid event id in cart." })
    }
    return res.status(500).send({ error: "Internal server error" })
  }
}

const buyTickets = async (req, res) => {
  try {
    const { reservedTickets } = req.body   //reservedTickets ex. [68bd76e9cf8fbb007f50b15b, 68bd76e9cf8fbb007f50b15n]
    console.log("reservedTickets", reservedTickets)
    const response = await buyReservedTickets({ userId: req.headers.id, ticketsIdArray: reservedTickets })
    console.log(response)

    if (response.modifiedCount === 0) {
      return res.status(400).send({ error: "Tickets reservation has expired!" })
    }
    const ticketsData = await getTicketsToPrint(reservedTickets)
    let emailData = { fullname: req.headers.fullname }  //{id1:[ticket1, ticket2],id2:[ticket1, ticket2]}
    for (let ticket of ticketsData) {
      if (emailData[ticket.eventId._id]) {
        emailData[ticket.eventId._id].push(ticket)
      } else {
        emailData[ticket.eventId._id] = [ticket]
      }
    }
    await sendMail(req.headers.email, "TICKETS", emailData, reservedTickets);
    return res.status(200).send(response)
  } catch (err) {
    console.error(err);
    return res.status(err.code || err.status || 500).send({ error: err.error || err.type || "Internal Server Error!" });
  }
}

const viewTicketsHistory = async (req, res) => {
  try {
    const search = req.query.search || null

    const regex = /^[a-zA-Z0-9 ]*$/g
    if (search && !regex.test(search)) {
      return res.status(400).send({ error: "Invalid search term!" })
    }

    const { events, ticketsIds } = await viewPurchasedTickets(req.headers.id, search)

    //get Images list 
    const DirPath = `${__dirname}/../../../uploads_events`;
    let filesList = []
    if (fs.existsSync(DirPath)) {
      filesList = fs.readdirSync(DirPath)
    }
    const images = {} // key=event._id; value=img name

    for (let event of events) {
      let imgSrc = null
      if (filesList.length > 0) {
        imgSrc = filesList.find(item => item.slice(0, 24) === event._id.toString()) || null
      }
      images[event._id] = imgSrc
    }

    return res.status(200).send({ events, images, ticketsIds })
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" })
  }
}


const cancelCheckout = async (req, res) => {
  try {
    const response = await cancelReservedTickets(req.headers.id)
    console.log(response)
    return res.status(200).send(response)
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error")
  }
}

const printTickets = async (req, res) => {
  try {
    let { ids } = req.query
    if (!ids) {
      return res.status(404).send({ error: "Requested url cannot be found" })
    }
    const ticketsIdsArray = ids.split(",")
    for (let id of ticketsIdsArray) {
      if (id.length !== 24) {
        return res.status(404).send({ error: "Requested url cannot be found" })
      }
    }
    const response = await createAllTickets(ticketsIdsArray)
    // console.log(response)
    return res.status(200).send(response)
  } catch (err) {
    console.error(err);
    if (err.name === "CastError") {
      return res.status(404).send({ error: "Requested url cannot be found" })
    }
    return res.status(500).send({ error: "Internal server error" })
  }
}

module.exports = { checkAvailableTicketsForEvent, selectCheckout, buyTickets, viewTicketsHistory, cancelCheckout, printTickets }