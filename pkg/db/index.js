const mongoose = require("mongoose");
const config = require("../config");

const init = () => {
  const url = config.getSection("db").url;

  // ${username}: Your MongoDB username
  // ${password}: Your MongoDB password
  // ${url}: The URL of your MongoDB cluster or server (excluding the port number)
  // ${dbname}: The name of the MongoDB database you want to connect to

  const dbname = config.getSection("db").dbname;
  const username = config.getSection("db").username;
  const password = config.getSection("db").password;
  const dsn = `mongodb+srv://${username}:${password}@cluster0.im0jw.mongodb.net/${dbname}?retryWrites=true&w=majority&appName=Cluster0`;

  mongoose
    .connect(dsn)
    .then((res) => console.log("DB connected!"))
    .catch((err) => console.log("Failed to connect!"))
    .finally(() => console.log("Finaly done!"));
};

module.exports = {
  init,
};
