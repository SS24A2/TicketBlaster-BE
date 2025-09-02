const mongoose = require("mongoose");

// da se dopolni shemata
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: "user"
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: "active"
  }
}, { timestamps: true });


const UserModel = mongoose.model("User", userSchema);


//***POST
const createUser = async (data) => {
  try {
    const res = await UserModel.insertOne(data)
    return res
  } catch (err) {
    console.error(err)
  }
}


//***GET
const getAllUsers = async () => {
  try {
    const res = await UserModel.find()
    return res
  } catch (err) {
    console.error(err)
  }
}

const getOneUser = async (filterObject) => {
  try {
    const res = await UserModel.findOne(filterObject)
    return res
  } catch (err) {
    console.error(err)
  }
}


//***PUT
const updateUser = async (id, data) => {
  try {
    const res = await UserModel.updateOne({ _id: id }, data)
    return res
  } catch (err) {
    console.error(err)
  }
}

//***DELETE
const deleteUser = async (id) => {
  try {
    const res = await UserModel.deleteOne({ _id: id })
    return res
  } catch (err) {
    console.error(err)
  }
}

module.exports = { createUser, getAllUsers, getOneUser, updateUser, deleteUser }
