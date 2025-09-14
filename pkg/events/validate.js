const { Validator } = require("node-input-validator");

// da se dopolni shemata
const CreateEvent = {
    name: "required|string",
    category: "required|string",
    date: "required|date",
    location: "required|string",
    details: "required|string",
    price: "required|integer",
    relatedEvents: "required|array",
};

const UpdateEvent = {
    name: "string",
    category: "string",
    date: "date",
    location: "string",
    details: "string",
    price: "numeric",
    relatedEvents: "array",
};

const validateEvent = async (data, schema) => {
    const validator = new Validator(data, schema);
    const result = await validator.check();

    if (!result) {
        throw {
            code: 422,
            error: validator.errors,
        };
    }
};

module.exports = {
    CreateEvent,
    UpdateEvent,
    validateEvent,
};