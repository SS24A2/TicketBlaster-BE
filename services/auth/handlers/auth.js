const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { AccountRegister, AccountLogin, AccountForgotPassword, AccountChangePassword, validateAccount } = require("../../../pkg/users/validate");
const { createUser, getOneUser, updateUser, updateUnverifiedUser, activateUser } = require("../../../pkg/users");
const config = require("../../../pkg/config");
const { sendMail } = require("../../../pkg/mailer/index");

const login = async (req, res) => {
  try {
    await validateAccount(req.body, AccountLogin);
    const { email, password } = req.body
    const existingUser = await getOneUser({ email: email })

    if (!existingUser || !bcrypt.compareSync(password, existingUser.password)) {
      return res.status(400).send("Incorrect email address or password!");
    }

    //only active user/admin gets an access token
    if (existingUser.status !== "active") {
      return res.status(400).send("Cannot log in! Your profile is unverified or deleted!");
    }

    const payload = {
      fullname: existingUser.fullname,
      email: email,
      id: existingUser._id,
      role: existingUser.role,
      status: existingUser.status
    }
    //req.auth contains the payload data (req.auth.fullname, req.auth.email, req.auth.id)

    const token = jwt.sign(payload, config.getSection("security").jwt_secret, { expiresIn: "7 days" });
    return res.status(200).send({ token });
  } catch (err) {
    console.error(err);
    return res.status(err.code || 500).send(err.error || "Internal Server Error!");
  }
};

const register = async (req, res) => {
  try {
    await validateAccount(req.body, AccountRegister);
    const { fullname, email, password, confirmPassword } = req.body
    const existingUser = await getOneUser({ email: email })

    if (existingUser && existingUser.status !== "pending") {
      return res.status(400).send("User with this email already exists")
    }

    if (confirmPassword !== password) {
      return res.status(400).send("Password confirmation failed.")
    }

    let createdDocument = null
    if (existingUser && existingUser.status === "pending") {
      createdDocument = await updateUnverifiedUser(existingUser.id, { fullname, password: bcrypt.hashSync(password) })
    } else {
      createdDocument = await createUser({ fullname, email, password: bcrypt.hashSync(password) })
    }

    const secret = config.getSection("security").jwt_secret + createdDocument.password
    const payload = {
      fullname: createdDocument.fullname,
      email: createdDocument.email,
      id: createdDocument._id,
      role: createdDocument.role,
      status: createdDocument.status
    };

    const token = jwt.sign(payload, secret, { expiresIn: "24h" });

    const link = `${config.getSection("links").verify}/${createdDocument._id}/${token}`
    await sendMail(email, "VERIFICATION", {
      link
    });
    return res.status(201).send({ id: createdDocument._id })
  } catch (err) {
    console.error(err);
    //MailgunAPIError; NIV error ...
    return res.status(err.code || err.status || 500).send(err.error || err.type || "Internal Server Error!");
  }
};

const verifyAccount = async (req, res) => {
  try {
    const { id, token } = req.params;
    const user = await getOneUser({ _id: id });
    if (!user) {
      return res.status(400).send({ error: "User not found!" });
    }
    if (user.status !== "pending") {
      return res.status(400).send({ error: "Verification completed" });
    }
    const secret = config.getSection("security").jwt_secret + user.password;

    jwt.verify(token, secret, { algorithms: ['HS256'] })

    const updateResult = await activateUser(id, { status: "active" })
    if (updateResult.modifiedCount === 1) {
      await sendMail(user.email, "WELCOME", { fullname: user.fullname, link1: "http://localhost:5173/", link2: "http://localhost:5173/faq" });
    }

    return res.status(200).send("Token is valid")
  } catch (err) {
    console.log(err);
    if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
      return res.status(401).send({ error: "Token not valid or expired!" })
    }
    return res.status(err.code || 500).send({ error: err.error || "Internal server error" });
  }
};

const resendVerificationMail = async (req, res) => {
  try {
    const { id } = req.params
    const unverifiedUser = await getOneUser({ _id: id })
    if (!unverifiedUser) {
      return res.status(400).send({ error: "User not found!" });
    }
    if (unverifiedUser.status !== "pending") {
      return res.status(400).send({ error: "Verification completed" })
    }
    const secret = config.getSection("security").jwt_secret + unverifiedUser.password
    const payload = {
      fullname: unverifiedUser.fullname,
      email: unverifiedUser.email,
      id: unverifiedUser._id,
      role: unverifiedUser.role,
      status: unverifiedUser.status
    };

    const token = jwt.sign(payload, secret, { expiresIn: "24h" });

    const link = `${config.getSection("links").verify}/${unverifiedUser._id}/${token}`
    await sendMail(unverifiedUser.email, "VERIFICATION", {
      link
    });

    return res.status(200).send("New verification email has been sent to your email address.")
  } catch (err) {
    console.error(err);
    //MailgunAPIError ...
    return res.status(err.code || 500).send(err.error || "Internal Server Error!");
  }
};

const forgotPassword = async (req, res) => {
  try {
    await validateAccount(req.body, AccountForgotPassword);
    const { email } = req.body;
    const user = await getOneUser({ email: email });

    if (!user) {
      return res.status(400).send("User not found!");
    }

    if (user.status !== "active") {
      return res.status(400).send("Your profile is unverified or deleted!");
    }

    const secret = config.getSection("security").jwt_secret + user.password;
    const payload = {
      fullname: user.fullname,
      email: user.email,
      id: user._id,
      role: user.role,
      status: user.status
    };

    const token = jwt.sign(payload, secret, { expiresIn: "15m" });

    const link = `${config.getSection("links").reset_password}/${user._id}/${token}`

    await sendMail(email, "PASSWORD_RESET", {
      fullname: user.fullname,
      link,
    });
    return res.status(200).send("Password reset link has been sent to your email...");
  } catch (err) {
    console.log(err);
    //MailgunAPIError; NIV error ...
    return res.status(err.code || err.status || 500).send(err.error || err.type || "Internal Server Error!");
  }
};

const resetPasswordLinkCheck = async (req, res) => {
  try {
    const { id, token } = req.params;
    const user = await getOneUser({ _id: id });
    if (!user) {
      return res.status(400).send({ error: "User not found!" });
    }
    const secret = config.getSection("security").jwt_secret + user.password;

    jwt.verify(token, secret, { algorithms: ['HS256'] })

    return res.status(200).send("Token is valid")
  } catch (err) {
    console.log(err);
    if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
      return res.status(401).send({ error: "Unauthorized. Token not valid" })
    }
    return res.status(500).send({ error: "Internal Server Error!" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;

    await validateAccount(req.body, AccountChangePassword);
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send({ error: "Passwords do not match!" });
    }

    const user = await getOneUser({ _id: id });

    if (!user) {
      return res.status(400).send({ error: "User not found!" });
    }

    const secret = config.getSection("security").jwt_secret + user.password;

    jwt.verify(token, secret, { algorithms: ['HS256'] })

    const newHashedPassword = bcrypt.hashSync(password);

    await updateUser(id, { password: newHashedPassword });
    return res.status(200).send("Password reset successful!");
  } catch (err) {
    console.log(err);
    if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
      return res.status(401).send({ error: "Unauthorized. Token not valid" })
    }
    return res.status(err.code || 500).send({ error: err.error || "Internal Server Error!" });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPasswordLinkCheck,
  resetPassword,
  verifyAccount,
  resendVerificationMail
};
