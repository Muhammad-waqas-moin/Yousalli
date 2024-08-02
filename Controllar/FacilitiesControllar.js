const Facilities = require("../Model/FacilitiesSchema");
const User = require("../Model/userSchema");
const mongoose = require("mongoose");
const isEmptyOrSpaces = (str) => !str || str.trim() === "";

// add new Facility
exports.createFacility = async (req, res) => {
  try {
    const userId = req.user.id;

    let { title } = req.body;
    if (!title) {
      return res.status(400).json({
        status: "failed",
        message: "Title is missing",
      });
    }
    title = title.trim();
    if (isEmptyOrSpaces(title)) {
      return res.status(400).json({
        status: "failed",
        message: "Title is empty or spaces",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist",
      });
    }

    const normalizedTitle = title.toLowerCase();
    const existingFacility = await Facilities.findOne({
      title: normalizedTitle,
    });

    if (existingFacility) {
      return res.status(400).json({
        status: "failed",
        message: "A facility with this title already exists.",
      });
    }
    const newFacility = new Facilities({
      title: normalizedTitle,
      createdBy: userId,
    });

    await newFacility.save();
    return res.status(200).json({
      status: "success",
      message: "New facility has been added successfully",
      data: newFacility,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "failed",
      message: err.message,
    });
  }
};

// Update Facility Title
exports.updateFacilityTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    const facilitiesId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(facilitiesId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid facilities ID" });
    }

    if (!title) {
      return res.status(400).json({
        status: "failed",
        message: "Title is missing",
      });
    }

    if (isEmptyOrSpaces(title)) {
      return res.status(400).json({
        status: "failed",
        message: "Title is empty or spaces",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist",
      });
    }

    const facility = await Facilities.findById(facilitiesId);
    if (!facility) {
      return res.status(404).json({
        status: "failed",
        message: "Facility not found",
      });
    }

    if (facility.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized to update this facility",
      });
    }

    facility.title = title.trim();
    const updatedFacility = await facility.save();

    return res.status(200).json({
      status: "success",
      message: "Facility title updated successfully",
      data: updatedFacility,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "failed",
      message: err.message,
    });
  }
};

// Update Facility isActive
exports.updateFacilityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid facility ID format.",
      });
    }
    const facility = await Facilities.findById(id);
    if (!facility) {
      return res.status(404).json({
        status: "failed",
        message: "facility not found.",
      });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        status: "failed",
        message: "The isActive field must be a boolean value.",
      });
    }
    facility.isActive = isActive;
    await facility.save();
    return res.status(200).json({
      status: "success",
      message: `facility has been ${
        facility.isActive ? "activated" : "deactivated"
      } successfully.`,
      data: facility,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", status: "error", message: error.message });
  }
};

// Delete a Facility
exports.deleteFacility = async (req, res) => {
  try {
    const userId = req.user.id;
    const facilityId = req.params.id;
    const facility = await Facilities.findById(facilityId);

    if (!facility) {
      return res.status(404).json({
        status: "failed",
        message: "Facility not found",
      });
    }

    if (facility.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized to delete this facility",
      });
    }
    await Facilities.findByIdAndDelete(facilityId);

    return res.status(200).json({
      status: "success",
      message: "Facility deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "failed",
      message: err.message,
    });
  }
};
