const express = require("express");
const {
  createNearByPlace,
  deleteNearByPlace,
  getNearbyPlaces,
  getNearbyPlacesByRangeAndType,
  getSingleNearByPlace,
  togglePlaceStatus,
  updateNearByPlace,
} = require("../Controllar/PlaceControllar");
const auth = require("../Middlewares/auth");
const Router = express.Router();
const upload = require("../Middlewares/multer");

//facilities Routes`
// Router.post("/nearby-Place", auth, createNearByPlace);
// Route to create a new NearByPlace
Router.post(
  "/nearby-place",
  auth,
  upload.array("images", 10),
  createNearByPlace
);
Router.delete("/nearby-place/:id", auth, deleteNearByPlace);
Router.get("/nearby-places", auth, getNearbyPlaces);
Router.get(
  "/nearby-places-by-range-and-type",
  auth,
  getNearbyPlacesByRangeAndType
);
Router.get("/nearbyplaces/:id", auth, getSingleNearByPlace);
Router.patch("/nearbyplaces/:placeId/status", auth, togglePlaceStatus);
Router.put("/places/:placeId", auth, updateNearByPlace);
module.exports = Router;
