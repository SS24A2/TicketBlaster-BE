const express = require("express");

const config = require("../../pkg/config");
const db = require("../../pkg/db");

const { postEvent, getEvents, getEvent, putEvent, deleteOneEvent, getEventsFromCart } = require("./handlers/events");
const checkRole = require("../../pkg/auth/user_role.middleware")

db.init();

const api = express();
api.use(express.json())

api.get("/api/v1/events", getEvents);
api.get("/api/v1/events/cart", getEventsFromCart); //requires jwt (not the case for the other events get routes)
api.get("/api/v1/events/:id", getEvent);


//admin routes
api.post("/api/v1/events", checkRole, postEvent);
api.put("/api/v1/events/:id", checkRole, putEvent);
api.delete("/api/v1/events/:id", checkRole, deleteOneEvent);

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
