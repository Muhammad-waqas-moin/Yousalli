// const PlaceType = mongoose.Schema({
//     title:{
//         type: String,
//         require: [true, "title is require"]
//     },
//     isActive:{
//         type:Boolean,
//         default:false
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//       }
// })
// module.exports = mongoose.model("PlaceType", PlaceType);
const mongoose = require("mongoose");
const PlaceTypeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("PlaceType", PlaceTypeSchema);
