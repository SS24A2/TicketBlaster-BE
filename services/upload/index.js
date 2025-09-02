const express = require("express");
const fileUpload = require("express-fileupload");

const config = require("../../pkg/config");
const { upload } = require("./handlers/upload");

const api = express();

api.use(fileUpload());

api.post("/api/v1/upload/:type/:id", upload);
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

