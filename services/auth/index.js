const express = require("express");

const config = require("../../pkg/config");
const auth = require("./handlers/auth");
const db = require("../../pkg/db");

db.init();

const api = express();
api.use(express.json());

//vo proxy ke stojat finalno ovie 2 linii, samo za testiranje se kopirani tuka
const cors = require("cors");
api.use(cors({ origin: "http://localhost:5173" }));

api.post("/api/v1/auth/login", auth.login);
api.post("/api/v1/auth/register", auth.register);
api.post("/api/v1/auth/forgotPassword", auth.forgotPassword);
api.get("/api/v1/auth/resetPassword/:id/:token", auth.resetPasswordLinkCheck);
api.put("/api/v1/auth/resetPassword/:id/:token", auth.resetPassword);

api.listen(config.getSection("services").auth.port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(
    "Service [auth] successfully started on port",
    config.getSection("services").auth.port
  );
});

