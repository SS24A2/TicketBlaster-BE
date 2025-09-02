const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { AccountRegister, AccountLogin, AccountForgotPassword, AccountChangePassword, validateAccount } = require("../../../pkg/users/validate");
const { createUser, getOneUser, updateUser } = require("../../../pkg/users");
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

    //TBC
    if (existingUser.userStatus === "deleted") {
      return res.status(400).send("Cannot log in! Your profile is inactive!");
    }

    const payload = {
      fullname: existingUser.fullname,
      email: email,
      id: existingUser._id,
    }
    //req.auth contains the payload data (req.auth.fullname, req.auth.email, req.auth.id)

    const token = jwt.sign(payload, config.getSection("security").jwt_secret, { expiresIn: "7 days" });
    return res.status(200).send({ token });
  } catch (err) {
    console.error(err);
    return res.status(err.code || 500).send(err.error || "Internal Server Error!"); //TBC
  }
};

const register = async (req, res) => {
  try {
    await validateAccount(req.body, AccountRegister);
    const { fullname, email, password, confirmPassword } = req.body
    const existingUser = await getOneUser({ email: email })

    if (existingUser) {
      return res.status(400).send("User with this email already exists")
    }

    if (confirmPassword !== password) {
      return res.status(400).send("Password confirmation failed.")
    }

    const createdDocument = await createUser({ fullname, email, password: bcrypt.hashSync(password) })
    await sendMail(email, "WELCOME", { fullname });
    return res.status(201).send(createdDocument)
  } catch (err) {
    console.error(err);
    //MailgunAPIError; NIV error ...
    return res.status(err.code || err.status || 500).send(err.error || err.type || "Internal Server Error!"); //TBC
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

    //TBC
    if (user.userStatus === "deleted") {
      return res.status(400).send("Your profile is inactive!");
    }

    const secret = config.getSection("security").jwt_secret + user.password;
    const payload = {
      fullname: user.fullname,
      email: user.email,
      id: user._id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "15m" });
    const link = `http://localhost:5173/account/password/reset/${user._id}/${token}`

    await sendMail(email, "PASSWORD_RESET", {
      fullname: user.fullname,
      link,
    });
    return res.status(200).send("Password reset link has been sent to your email...");
  } catch (err) {
    console.log(err);
    //MailgunAPIError; NIV error ...
    return res.status(err.code || err.status || 500).send(err.error || err.type || "Internal Server Error!"); //TBC
  }
};

const resetPasswordLinkCheck = async (req, res) => {
  try {
    const { id, token } = req.params;
    const user = await getOneUser({ _id: id });
    if (!user) {
      return res.status(400).send("User not found!");
    }
    const secret = config.getSection("security").jwt_secret + user.password;
    jwt.verify(token, secret, { algorithms: ['HS256'] }, function (err, decoded) {
      if (err) {
        return res.status(401).send("Unauthorized. Token not valid")
      }
    });

    return res.status(200).send("Token is valid")
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;

    await validateAccount(req.body, AccountChangePassword);
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match!");
    }

    const user = await getOneUser({ _id: id });

    if (!user) {
      return res.status(400).send("User not found!");
    }

    const secret = config.getSection("security").jwt_secret + user.password;
    jwt.verify(token, secret, { algorithms: ['HS256'] }, function (err, decoded) {
      if (err) {
        return res.status(401).send("Unauthorized. Token not valid")
      }
    });

    const newHashedPassword = bcrypt.hashSync(password);

    await updateUser(id, { password: newHashedPassword });
    return res.status(200).send("Password reset successful!");
  } catch (err) {
    console.log(err);
    return res.status(err.code || 500).send(err.error || "Internal Server Error!");
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPasswordLinkCheck,
  resetPassword,
};
