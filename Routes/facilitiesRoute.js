const express = require("express");
const {
  createFacility,
  updateFacilityTitle,
  updateFacilityStatus,
  deleteFacility,
} = require("../Controllar/FacilitiesControllar");
const auth = require("../Middlewares/auth");
const Router = express.Router();

//facilities Routes
Router.post("/create-facility", auth, createFacility);
Router.patch("/facility/:id/status", updateFacilityStatus);
Router.patch("/facility/:id/title", auth, updateFacilityTitle);
Router.delete("/facility/:id", auth, deleteFacility);
module.exports = Router;
