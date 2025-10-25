const express = require("express");

const config = require("../../pkg/config");
const db = require("../../pkg/db");

const { checkAvailableTicketsForEvent, selectCheckout, buyTickets, viewTicketsHistory, cancelCheckout, printTickets } = require("./handlers/ecommerce");

db.init();

const api = express();
api.use(express.json())

api.get("/api/v1/ecommerce/:id", checkAvailableTicketsForEvent);
api.put("/api/v1/ecommerce/checkout", selectCheckout);
api.put("/api/v1/ecommerce/checkout/cancel", cancelCheckout);
api.put("/api/v1/ecommerce/payment", buyTickets);
api.get("/api/v1/ecommerce/tickets/history", viewTicketsHistory);
api.get("/api/v1/ecommerce/tickets/print", printTickets);

// Port 10003
api.listen(config.getSection("services").ecommerce.port, (err) => {
  if (err) {
    console.log("error", err);
    return;
  }
  console.log(
    "Service [ecommerce] successfully started on port",
    config.getSection("services").ecommerce.port
  );
});