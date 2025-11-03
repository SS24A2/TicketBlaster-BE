const { Validator } = require("node-input-validator");

const validateCart = async (data, schema) => {
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
    UpdateCart,
    validateCart,
};