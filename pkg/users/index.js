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
    default: "user",
    message: '{VALUE} is not a supported role. Please choose user or admin.'
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: "active",
    message: '{VALUE} is not a supported status. Please choose active or deleted.'
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
    throw err
  }
}


//***GET
const getAllUsers = async () => {
  try {
    const res = await UserModel.find()
    return res
  } catch (err) {
    console.error(err)
    throw err
  }
}

const getOneUser = async (filterObject) => {
  try {
    const res = await UserModel.findOne(filterObject)
    return res
  } catch (err) {
    console.error(err)
    throw err
  }
}


//***PUT
const updateUser = async (id, data) => {
  try {
    const res = await UserModel.updateOne({ _id: id }, data, { runValidators: true })
    return res
  } catch (err) {
    console.error(err)
    throw err
  }
}

//***DELETE
const deleteUser = async (id) => {
  try {
    const res = await UserModel.deleteOne({ _id: id })
    return res
  } catch (err) {
    console.error(err)
    throw err
  }
}

module.exports = { createUser, getAllUsers, getOneUser, updateUser, deleteUser }
