const express = require("express");
const databaseConnection = require("./config/db");
const app = express();
app.use(express.json());

//database connection
databaseConnection();

app.listen(process.env.PORT, () => {
  console.log("server is listning on port 5000");
});

const userRoute = require("./Routes/userRoute");
app.use("/api/v1", userRoute);
