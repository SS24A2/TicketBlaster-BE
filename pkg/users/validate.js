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

const AccountUpdate = {
  fullname: "string",
  email: "email",
  password: "string",
  confirmPassword: "string",
};

const AccountRoleUpdate = {
  role: "string|in:user,admin"
};

const AccountForgotPassword = {
  email: "required|email"
};

const AccountChangePassword = {
  password: "required|string",
  confirmPassword: "required|string",
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
  AccountUpdate,
  AccountRoleUpdate,
  AccountForgotPassword,
  AccountChangePassword,
  validateAccount,
};