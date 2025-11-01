const bcrypt = require("bcryptjs");
const fs = require("fs");

const { AccountUpdateDetails, AccountChangePassword, validateAccount, AccountRoleUpdate } = require("../../../pkg/users/validate");
const { getOneUser, updateUser, getAllUsers } = require("../../../pkg/users");


const listAllUsers = async (req, res) => {
    try {
        const DirPath = `${__dirname}/../../../uploads_users`;
        let filesList = []
        if (fs.existsSync(DirPath)) {
            filesList = fs.readdirSync(DirPath)
        }

        const users = await getAllUsers()
        const images = {} // key=user._id; value=img name

        for (let user of users) {
            let imgSrc = null
            if (filesList.length > 0) {
                imgSrc = filesList.find(item => item.slice(0, 24) === user._id.toString()) || null
            }
            images[user._id] = imgSrc
        }

        return res.status(200).send({ users, images }); //TBC
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error!"); //TBC
    }
};

const getUser = async (req, res) => {
    try {
        const user = await getOneUser({ _id: req.headers.id })

        const DirPath = `${__dirname}/../../../uploads_users`;
        let filesList = []
        if (fs.existsSync(DirPath)) {
            filesList = fs.readdirSync(DirPath)
        }

        let image = null

        if (filesList.length > 0) {
            image = filesList.find(item => item.slice(0, 24) === user._id.toString()) || null
        }

        return res.status(200).send({ user, image }); //TBC
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error!"); //TBC
    }
};

const changeUserRole = async (req, res) => {
    try {
        const accountToUpdate = await getOneUser({ _id: req.params.id })

        if (!accountToUpdate || accountToUpdate.status !== "active") {
            return res.status(400).send("User role cannot be updated!");
        }

        await validateAccount(req.body, AccountRoleUpdate)
        const { role } = req.body;

        //the role is already set to the selected value
        if (role === accountToUpdate.role) {
            return res.status(200).send(accountToUpdate);
        }
        const updatedAccount = await updateUser(accountToUpdate._id, { role })

        return res.status(200).send(updatedAccount)
    } catch (err) {
        console.error(err);
        return res.status(err.code || 500).send(err.error | "Internal Server Error!"); //TBC
    }
};

const deleteUser = async (req, res) => {
    try {
        const accountToUpdate = await getOneUser({ _id: req.params.id })

        if (!accountToUpdate) {
            return res.status(400).send("Account not found!");
        }

        if (accountToUpdate.status === "deleted") {
            return res.status(200).send("Account is deleted!")
        }

        await updateUser(accountToUpdate._id, { status: "deleted" })
        return res.status(200).send("Account is deleted!")
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error!"); //TBC
    }
};


const changeProfileInfo = async (req, res) => {
    try {
        await validateAccount(req.body, AccountUpdateDetails)
        const { fullname, email } = req.body

        const account = await getOneUser({ _id: req.headers.id })

        if (!account || account.status !== "active") {
            return res.status(400).send({ error: "User not found!" });
        }

        if (email) {
            const existingUser = await getOneUser({ email: email })
            if (existingUser) {
                return res.status(400).send({ error: "User with this email already exists!" });
            }
        }

        if (account.fullname === fullname && account.email === email) {
            return res.status(200).send({ error: "No changes in data." })
        }

        const newData = fullname && email ? { fullname, email } : fullname ? { fullname } : email ? { email } : null
        const updatedAccount = await updateUser(account._id, newData)
        return res.status(200).send(updatedAccount)
    } catch (err) {
        console.log(err);
        return res.status(err.code || 500).send({ error: err.error | "Internal Server Error!" }); //TBC
    }
};

const changePassword = async (req, res) => {
    try {
        await validateAccount(req.body, AccountChangePassword)
        const { password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).send({ error: "Passwords do not match!" });
        }

        const account = await getOneUser({ _id: req.headers.id })

        if (!account || account.status !== "active") {
            return res.status(400).send({ error: "User not found!" });
        }

        const newHashedPassword = bcrypt.hashSync(password);
        const updatedAccount = await updateUser(account._id, { password: newHashedPassword })
        return res.status(200).send(updatedAccount)
    } catch (err) {
        console.log(err);
        return res.status(err.code || 500).send({ error: err.error | "Internal Server Error!" }); //TBC
    }
};

module.exports = {
    listAllUsers,
    changeUserRole,
    deleteUser,
    changeProfileInfo,
    changePassword,
    getUser
};
