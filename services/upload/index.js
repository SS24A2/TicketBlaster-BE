const express = require("express");
const fileUpload = require("express-fileupload");

const config = require("../../pkg/config");
const { upload } = require("./handlers/upload");

const api = express();

api.use(fileUpload());

const checkRole = (req, res, next) => {
  if (req.params.type === "event") {
    if (req.headers.role !== "admin") {
      res.status(401).send({ error: "Unauthorized!!!" })
    } else {
      next()
    }
  } else {
    next()
  }
}

api.post("/api/v1/upload/:type/:id", checkRole, upload);
//type is event or user
//id is event id or user id

// PORT: 10001
api.listen(config.getSection("services").upload.port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(
    "Service [upload] successfully started on port",
    config.getSection("services").upload.port
  );
});

