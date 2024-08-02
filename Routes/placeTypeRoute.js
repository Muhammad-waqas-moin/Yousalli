const express = require("express");
const {
  createPlaceType,
  updatePlaceTypeStatus,
  updatePlaceType,
  deletePlaceType,
} = require("../Controllar/PlaceTypeControllar");
const auth = require("../Middlewares/auth");
const Router = express.Router();

//placeType Routes`
Router.post("/createPlace-type", auth, createPlaceType);
Router.patch("/place-type/:id/status", updatePlaceTypeStatus);
Router.patch("/place-type/:id/title", auth, updatePlaceType);
Router.delete("/place-type/:id", auth, deletePlaceType);
module.exports = Router;
