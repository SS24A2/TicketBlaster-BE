const express = require("express");

const config = require("../../pkg/config");
const db = require("../../pkg/db");
const cars = require("./handlers/events");

db.init();

const api = express();
api.use(express.json())

api.get("/api/v1/cars", cars.getVehicle);
api.post("/api/v1/cars", cars.createVehicle);
api.put("/api/v1/cars/:id", cars.updateVehicle);
api.delete("/api/v1/cars/:id", cars.removeVehicle);

// Port 10004
api.listen(config.getSection("services").cars.port, (err) => {
    if (err) {
        console.log("error", err);
        return;
    }
    console.log(
        "Service [cars] successfully started on port",
        config.getSection("services").cars.port
    );
});
