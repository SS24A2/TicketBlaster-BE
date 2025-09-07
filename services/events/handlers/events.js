const { createEvent, getAllEvents, getOneEvent, updateEvent, deleteEvent } = require("../../../pkg/events");
const { CreateEvent, UpdateEvent, validateEvent } = require("../../../pkg/events/validate");


//only active and admin profiles can create, update and delete events - checked in all 3 handlers

const postEvent = async (req, res) => {
    try {
        console.log(req.headers)
        if (req.headers.role !== "admin" || req.headers.status !== "active") {
            return res.status(400).send("Unauthorized!");
        }
        await validateEvent(req.body, CreateEvent)
        const createdDocument = await createEvent(req.body)
        return res.status(201).send(createdDocument)
    } catch (err) {
        console.error(err);
        if (err.name === "ValidationError") {
            return res.status(422).send(err.message); //mongoose validation error (category-enum; relatedEvents-ObjectId)
        }
        return res.status(err.code || 500).send(err.error || "Internal server error"); //NIV validation error
    }
}

const getEvents = async (req, res) => {
    try {
        // const timeNow = new Date()

        const response = await getAllEvents(num5.filterObj, num5.sortObj, num5.page, num5.pageSize)

        return res.status(200).send(response)
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal server error")
    }
}

//Num1 - 5 koncerti od pobliski do podalecni, nikoj da ne e zavrshen/pominat i ne zemaj vo predvid concert objaven kako glaven; istoto za komedii
const timeNow = new Date()
const num1 = {
    filterObj: { date: { $gte: timeNow }, _id: { $ne: "68bcc56e29d5394a0dab18d3" }, category: "Stand-up Comedy" },
    sortObj: { date: 1 },
    page: 1,
    pageSize: 5
}


//Num2 - glavniot najskoreshen nastan 
const num2 = {
    filterObj: { date: { $gte: timeNow } },
    sortObj: { date: 1 },
    page: 1,
    pageSize: 1
}


//Num3 - stranica za koncerti ili komedii - inicijalen fetch
const num3 = {
    filterObj: { date: { $gte: timeNow }, category: "Musical Concert" },
    sortObj: { date: 1 },
    page: 1,
    pageSize: 20
}


//Num4 - stranica za koncerti ili komedii - fetch na Load More kopce
const num4 = {
    filterObj: { date: { $gte: timeNow }, category: "Musical Concert" },
    sortObj: { date: 1 },
    page: 3,
    pageSize: 10
}


//Num5 - search rezultati 
const num5 = {
    filterObj: { date: { $gte: timeNow }, $or: [{ name: { $regex: "(?i)nam(?-i)" } }, { details: { $regex: "(?i)det(?-i)" } }] },
    sortObj: { date: 1 },
    page: 1,
    pageSize: 20 //most relevant results
}



const getEvent = async (req, res) => {
    try {
        const response = await getOneEvent({ _id: req.params.id })
        if (!response) {
            return res.status(400).send("The selected event is not found")
        }
        return res.status(200).send(response)
    } catch (err) {
        console.error(err);
        if (err.name === "CastError") { //mongoose error - incorect format for event id in req.url
            return res.status(400).send("Invalid ObjectId format in the url")
        }
        return res.status(500).send("Internal server error")
    }
}

const putEvent = async (req, res) => {
    try {
        if (req.headers.role !== "admin" || req.headers.status !== "active") {
            return res.status(400).send("Unauthorized!");
        }
        await validateEvent(req.body, UpdateEvent)
        const response = await updateEvent(req.params.id, req.body)
        if (response.modifiedCount === 0) {
            return res.status(400).send("The selected event is not found")
        }
        return res.status(200).send(response)
    } catch (err) {
        console.error(err);
        console.error(err.name);
        if (err.name === "ValidationError") { //mongoose validation error (category-enum; relatedEvents-ObjectId)
            console.log("name1", err, err.name)
            return res.status(422).send(err.message);
        }
        if (err.name === "CastError") { //mongoose error - incorect format for event id in req.url or related events
            console.log("name2", err, err.name)
            return res.status(400).send("Invalid ObjectId format in the url or in the list of related events")
        }
        return res.status(err.code || 500).send(err.error || "Internal server error"); //NIV validation error
    }
}

const deleteOneEvent = async (req, res) => {
    try {
        if (req.headers.role !== "admin" || req.headers.status !== "active") {
            return res.status(400).send("Unauthorized!");
        }
        const response = await deleteEvent(req.params.id)
        if (response.deletedCount === 0) {
            return res.status(400).send("The selected event is not found")
        }
        return res.status(200).send(response)
    } catch (err) {
        console.error(err);
        if (err.name === "CastError") { //mongoose error - incorect format for event id in req.url
            return res.status(400).send("Invalid ObjectId format in the url")
        }
        return res.status(500).send("Internal server error")
    }
}

module.exports = { postEvent, getEvents, getEvent, putEvent, deleteOneEvent }