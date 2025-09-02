const mongoose = require("mongoose");

// da se dopolni shemata
const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Musical Concert', 'Stand-up Comedy'],
    },
    date: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    relatedEvents: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: "Event",
    },
}, { timestamps: true });


const EventModel = mongoose.model("Event", eventSchema);


//***POST
const createEvent = async (data) => {
    try {
        const res = await EventModel.insertOne(data)
        return res
    } catch (err) {
        console.error(err)
    }
}


//***GET
const getAllEvents = async (filterObject) => {
    try {
        const res = await EventModel.find(filterObject)
        return res
    } catch (err) {
        console.error(err)
    }
}

const getOneEvent = async (filterObject) => {
    try {
        const res = await EventModel.findOne(filterObject)
        return res
    } catch (err) {
        console.error(err)
    }
}


//***PUT
const updateEvent = async (id, data) => {
    try {
        const res = await EventModel.updateOne({ _id: id }, data)
        return res
    } catch (err) {
        console.error(err)
    }
}

//***DELETE
const deleteEvent = async (id) => {
    try {
        const res = await EventModel.deleteOne({ _id: id })
        return res
    } catch (err) {
        console.error(err)
    }
}

module.exports = { createEvent, getAllEvents, getOneEvent, updateEvent, deleteEvent }
