const PlaceType = require("../Model/PlaceTypeSchema");
const mongoose = require("mongoose");
const User = require("../Model/userSchema");
const isEmptyOrSpaces = (str) => !str || str.trim() === "";

// Add new PlaceType
exports.createPlaceType = async (req, res) => {
  try {
    console.log("place type route hits");
    const userId = req.user.id;
    const { title, isActive } = req.body;
    if (isEmptyOrSpaces(title)) {
      return res.status(400).json({
        status: "failed",
        message: "Title is required and cannot be empty or just spaces.",
      });
    }
    // Validate isActive field
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        status: "failed",
        message: "Active field must be a boolean value.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist.",
      });
    }

    const normalizedTitle = title.trim().toLowerCase();
    const existingPlaceType = await PlaceType.findOne({
      title: normalizedTitle,
    });

    if (existingPlaceType) {
      return res.status(400).json({
        status: "failed",
        message: "A PlaceType with this title already exists.",
      });
    }
    const newPlaceType = new PlaceType({
      title: title.trim(),
      isActive: isActive || false,
      createdBy: userId,
    });

    await newPlaceType.save();
    return res.status(201).json({
      status: "success",
      message: "New place type has been added successfully.",
      data: newPlaceType,
    });
  } catch (error) {
    console.log("err===>", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Update the isActive status of a PlaceType
exports.updatePlaceTypeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid PlaceType ID format.",
      });
    }
    const placeType = await PlaceType.findById(id);
    if (!placeType) {
      return res.status(404).json({
        status: "failed",
        message: "PlaceType not found.",
      });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        status: "failed",
        message: "The isActive field must be a boolean value.",
      });
    }
    placeType.isActive = isActive;
    await placeType.save();
    return res.status(200).json({
      status: "success",
      message: `PlaceType has been ${
        placeType.isActive ? "activated" : "deactivated"
      } successfully.`,
      data: placeType,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Update PlaceType title
exports.updatePlaceType = async (req, res) => {
  try {
    const placeTypeId = req.params.id;
    const userId = req.user.id;
    const { title } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(placeTypeId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid PlaceType ID" });
    }

    const placeType = await PlaceType.findById(placeTypeId);
    if (!placeType) {
      return res
        .status(404)
        .json({ status: "failed", message: "PlaceType not found" });
    }

    if (placeType.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized to update this place type",
      });
    }

    if (isEmptyOrSpaces(title)) {
      return res.status(400).json({
        status: "failed",
        message: "Title is required and cannot be empty or just spaces.",
      });
    }

    const normalizedTitle = title.trim().toLowerCase();
    // Check if a PlaceType with the same title already exists, excluding the current one
    const existingPlaceType = await PlaceType.findOne({
      title: normalizedTitle,
      _id: { $ne: placeTypeId }, // Exclude the current PlaceType being updated
    });

    if (existingPlaceType) {
      return res.status(400).json({
        status: "failed",
        message: "A PlaceType with this title already exists.",
      });
    }

    // Update PlaceType title
    const updatedPlaceType = await PlaceType.findByIdAndUpdate(
      placeTypeId,
      { $set: { title: title.trim() } },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "PlaceType title updated successfully.",
      data: updatedPlaceType,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Delete PlaceType
exports.deletePlaceType = async (req, res) => {
  try {
    const placeTypeId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(placeTypeId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid PlaceType ID" });
    }

    const placeType = await PlaceType.findById(placeTypeId);
    if (!placeType) {
      return res
        .status(404)
        .json({ status: "failed", message: "PlaceType not found" });
    }

    if (placeType.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized to delete this place type",
      });
    }

    // Delete PlaceType
    await PlaceType.findByIdAndDelete(placeTypeId);

    res.status(200).json({
      status: "success",
      message: "PlaceType deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
