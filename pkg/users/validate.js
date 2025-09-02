const { Validator } = require("node-input-validator");

// da se dopolni shemata
const AccountRegister = {
  fullname: "required|string",
  email: "required|email",
  password: "required|string",
  confirmPassword: "required|string",
};

const AccountLogin = {
  email: "required|email",
  password: "required|string",
};

const AccountForgotPassword = {
  email: "required|email"
};

const AccountChangePassword = {
  password: "required|string",
  confirmPassword: "required|string",
};

const AccountUpdateDetails = {
  fullname: "required|string",
  email: "required|email",
};

const AccountRoleUpdate = {
  role: "required|string|in:user,admin"
};

const AccountStatusUpdate = {
  status: "required|string|in:active,deleted"
};


const validateAccount = async (data, schema) => {
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
  AccountRegister,
  AccountLogin,
  AccountUpdateDetails,
  AccountForgotPassword,
  AccountChangePassword,
  AccountRoleUpdate,
  AccountStatusUpdate,
  validateAccount,
};