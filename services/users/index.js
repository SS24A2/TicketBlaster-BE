const express = require("express");

const config = require("../../pkg/config");
const db = require("../../pkg/db");
const { listAllUsers, changeUserRole, deleteUser, changeProfileInfo, changePassword } = require("./handlers/users");

db.init();

const api = express();
api.use(express.json());

api.get("/api/v1/users/list", listAllUsers);
api.put("/api/v1/users/role/:id", changeUserRole);
api.put("/api/v1/users/status/:id", deleteUser);
api.put("/api/v1/account/details", changeProfileInfo);
api.put("/api/v1/account/password", changePassword);

api.listen(config.getSection("services").users.port, (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log(
        "Service [users] successfully started on port",
        config.getSection("services").users.port
    );
});

