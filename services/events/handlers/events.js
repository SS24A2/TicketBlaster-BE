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
        const sortObject = { date: 1 } // rezultati podredeni od najskoreshni do najdalecni po datum na event-ot
        let { category, search, excludedId, page, pageSize } = req.query

        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;

        const dateNow = new Date()
        let filterObject = {}
        if (excludedId) {
            filterObject._id = { $ne: excludedId }
        }
        if (category) {
            filterObject.category = category
        }
        if (search) {
            filterObject = { ...filterObject, $or: [{ name: { $regex: `(?i)${search}(?-i)` } }, { details: { $regex: `(?i)${search}(?-i)` } }] }
        }
        filterObject.date = { $gte: dateNow }
        console.log("filter", filterObject)
        console.log("page", page, pageSize)
        console.log("sort", sortObject)

        const events = await getAllEvents({ filterObject, sortObject, page, pageSize })

        return res.status(200).send(events)
    } catch (err) {
        console.error(err);
        if (err.name === "CastError") { //mongoose error - incorect format for event id in req.url
            return res.status(400).send("Invalid ObjectId format in the url")
        }
        return res.status(500).send("Internal server error")
    }
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
        if (err.name === "ValidationError") { //mongoose validation error (category-enum; relatedEvents-ObjectId)
            return res.status(422).send(err.message);
        }
        if (err.name === "CastError") { //mongoose error - incorect format for event id in req.url or related events
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