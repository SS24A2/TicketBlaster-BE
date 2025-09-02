const bcrypt = require("bcryptjs");

const { AccountUpdateDetails, AccountChangePassword, validateAccount, AccountRoleUpdate } = require("../../../pkg/users/validate");
const { getOneUser, updateUser, getAllUsers } = require("../../../pkg/users");


const listAllUsers = async (req, res) => {
    try {
        const account = await getOneUser({ _id: req.auth.id })

        if (!account || account.role !== "admin" || account.status === "deleted") {
            return res.status(400).send("Unauthorized!");
        }

        const users = await getAllUsers()
        return res.status(200).send({ users }); //TBC
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error!"); //TBC
    }
};

const changeUserRole = async (req, res) => {
    try {
        const account = await getOneUser({ _id: req.auth.id })

        if (!account || account.role !== "admin" || account.status === "deleted") {
            return res.status(400).send("Unauthorized!");
        }

        const accountToUpdate = await getOneUser({ _id: req.params.id })

        if (!accountToUpdate || accountToUpdate.status === "deleted") {
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
        const account = await getOneUser({ _id: req.auth.id })

        if (!account || account.role !== "admin" || account.status === "deleted") {
            return res.status(400).send("Unauthorized!");
        }

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

//should include change in profile image
const changeProfileInfo = async (req, res) => {
    try {
        await validateAccount(req.body, AccountUpdateDetails)
        const { fullname, email } = req.body

        const account = await getOneUser({ _id: req.auth.id })

        if (!account || account.status !== "deleted") {
            return res.status(400).send("User not found!");
        }

        if (account.fullname === fullname && account.email === email) {
            return res.status(200).send(account)
        }
        const updatedAccount = await updateUser(account._id, { fullname, email })
        return res.status(200).send(updatedAccount)
    } catch (err) {
        console.log(err);
        return res.status(err.code || 500).send(err.error | "Internal Server Error!"); //TBC
    }
};

const changePassword = async (req, res) => {
    try {
        await validateAccount(req.body, AccountChangePassword)
        const { password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).send("Passwords do not match!");
        }

        const account = await getOneUser({ _id: req.auth.id })

        if (!account || account.status !== "deleted") {
            return res.status(400).send("User not found!");
        }

        const newHashedPassword = bcrypt.hashSync(password);
        const updatedAccount = await updateUser(account._id, { password: newHashedPassword })
        return res.status(200).send(updatedAccount)
    } catch (err) {
        console.log(err);
        return res.status(err.code || 500).send(err.error | "Internal Server Error!"); //TBC
    }
};

module.exports = {
    listAllUsers,
    changeUserRole,
    deleteUser,
    changeProfileInfo,
    changePassword
};
