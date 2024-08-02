const express = require("express");
const databaseConnection = require("./config/db");
const app = express();
app.use(express.json());

//database connection
databaseConnection();

app.listen(process.env.PORT, () => {
  console.log("server is listning on port 5000");
});

//user
const userRoutes = require("./Routes/userRoute");
app.use("/api/v1", userRoutes);

//facilites
const facilitiesRoutes = require("./Routes/facilitiesRoute");
app.use("/api/v1", facilitiesRoutes);

//nearby places
const nearbyPlacesRoutes = require("./Routes/PlaceRoute");
app.use("/api/v1", nearbyPlacesRoutes);

//places type
const placeTypeRoute = require("./Routes/placeTypeRoute");
app.use("/api/v1", placeTypeRoute);

//post
const postRoutes = require("./Routes/PostRoutes");
app.use("/api/v1", postRoutes);
