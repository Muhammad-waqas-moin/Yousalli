const mongoose = require("mongoose");
const NearByPlace = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
    },
    placeType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlaceType",
      required: true,
    },
    facilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Facilities" }],
    images: [{ type: String, required: false, default: "" }],
    location: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON type
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    // location: {
    //   latitude: { type: Number },
    //   longitude: {
    //     type: Number,
    //   },
    // },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);
// Create a 2dsphere index on the 'location' field
NearByPlace.index({ location: "2dsphere" });
module.exports = mongoose.model("NearByPlace", NearByPlace);
