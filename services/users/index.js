const express = require("express");

const config = require("../../pkg/config");
const db = require("../../pkg/db");
const { listAllUsers, changeUserRole, deleteUser, changeProfileInfo, changePassword, getUser } = require("./handlers/users");
const checkRole = require("../../pkg/auth/user_role.middleware")
db.init();

const api = express();
api.use(express.json());

api.get("/api/v1/users/user", getUser);
api.put("/api/v1/users/details", changeProfileInfo);
api.put("/api/v1/users/password", changePassword);

//admin routes
api.get("/api/v1/users/list", checkRole, listAllUsers);
api.put("/api/v1/users/role/:id", checkRole, changeUserRole);
api.put("/api/v1/users/status/:id", checkRole, deleteUser);


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

