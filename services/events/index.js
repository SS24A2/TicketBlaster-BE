const express = require("express");

const config = require("../../pkg/config");
const db = require("../../pkg/db");

const { postEvent, getEvents, getEvent, putEvent, deleteOneEvent } = require("./handlers/events");

db.init();

const api = express();
api.use(express.json())

api.get("/api/v1/events", getEvents);
api.get("/api/v1/events/:id", getEvent);
api.post("/api/v1/events", postEvent);
api.put("/api/v1/events/:id", putEvent);
api.delete("/api/v1/events/:id", deleteOneEvent);

// Port 10004
api.listen(config.getSection("services").events.port, (err) => {
    if (err) {
        console.log("error", err);
        return;
    }
    console.log(
        "Service [events] successfully started on port",
        config.getSection("services").events.port
    );
});
