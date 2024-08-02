const NearByPlace = require("../Model/NearByPalceSchema");
const PlaceType = require("../Model/PlaceTypeSchema");
const mongoose = require("mongoose");
const User = require("../Model/userSchema");

const isEmptyOrSpaces = (str) => !str || str.trim() === "";

// Add new NearByPlace
exports.createNearByPlace = async (req, res) => {
  try {
    const userId = req.user.id;
    let { title, description, placeType, facilities, images, location } =
      req.body;

    // console.log("facilities array ===> ", facilities);
    // Validate required fields
    if (
      isEmptyOrSpaces(title) ||
      isEmptyOrSpaces(description) ||
      isEmptyOrSpaces(placeType)
    ) {
      return res.status(400).json({
        status: "failed",
        message:
          "Title, description, and placeType are required and cannot be empty or just spaces.",
      });
    }

    // Validate placeType
    const validPlaceType = await PlaceType.findById(placeType);
    if (!validPlaceType) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid placeType.",
      });
    }

    // Ensure facilities is an array
    if (facilities) {
      console.log("========>1", typeof facilities);
      try {
        facilities = JSON.parse(facilities);
        console.log("========>2", typeof facilities);
      } catch (err) {
        return res.status(400).json({
          status: "failed",
          message: "Facilities should be a valid JSON array.",
        });
      }
    }

    // Validate facilities
    if (Array.isArray(facilities) && facilities.length > 0) {
      facilities = facilities.filter((facility) =>
        mongoose.Types.ObjectId.isValid(facility)
      );
      if (facilities.length === 0) {
        return res.status(400).json({
          status: "failed",
          message: "Facilities must contain valid ObjectId values.",
        });
      }
    }

    // Validate images
    if (images && images.length > 0) {
      images = images.filter((image) => !isEmptyOrSpaces(image));
    }

    // Validate and convert location
    if (location) {
      const { latitude, longitude } = location;
      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);

      if (isNaN(lat) || isNaN(long)) {
        return res.status(400).json({
          status: "failed",
          message:
            "Invalid location data. Latitude and longitude must be numbers.",
        });
      }

      location = {
        type: "Point",
        coordinates: [long, lat], // Note the order: [longitude, latitude]
      };

      // Check for existing NearByPlace with the same location
      const existingPlace = await NearByPlace.findOne({
        "location.coordinates": { $all: [long, lat] },
      });

      if (existingPlace) {
        return res.status(400).json({
          status: "failed",
          message: "A place with this location already exists.",
        });
      }
    } else {
      return res.status(400).json({
        status: "failed",
        message: "Location is required.",
      });
    }

    // // Validate and convert location
    // if (location) {
    //   const { latitude, longitude } = location;
    //   const lat = parseFloat(latitude);
    //   const long = parseFloat(longitude);

    //   if (isNaN(lat) || isNaN(long)) {
    //     return res.status(400).json({
    //       status: "failed",
    //       message:
    //         "Invalid location data. Latitude and longitude must be numbers.",
    //     });
    //   }

    //   location = { latitude: lat, longitude: long };

    //   // Check for existing NearByPlace with the same location
    //   const existingPlace = await NearByPlace.findOne({
    //     "location.latitude": lat,
    //     "location.longitude": long,
    //   });

    //   if (existingPlace) {
    //     return res.status(400).json({
    //       status: "failed",
    //       message: "A place with this location already exists.",
    //     });
    //   }
    // }
    const newNearByPlace = new NearByPlace({
      title,
      description,
      placeType,
      images: req.files ? req.files.map((file) => file.path) : [],
      location,
      facilities,
      createdBy: userId,
    });

    await newNearByPlace.save();
    return res.status(200).json({
      status: "success",
      message: "New place has been added successfully.",
      data: newNearByPlace,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// Delete NearByPlace
exports.deleteNearByPlace = async (req, res) => {
  try {
    const userId = req.user.id;
    const placeId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid PlaceType ID" });
    }
    const place = await NearByPlace.findById(placeId);
    if (!place) {
      return res.status(404).json({
        status: "failed",
        message: "NearByPlace not found",
      });
    }
    if (place.createdBy.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized to delete this place",
      });
    }
    // Delete PlaceType
    await NearByPlace.findByIdAndDelete(placeId);
    return res.status(200).json({
      status: "success",
      message: "NearByPlace deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get Nearby Places
exports.getNearbyPlaces = async (req, res) => {
  console.log("hits getnearby places");
  try {
    const userId = req.user.id;
    const { radius = 10 } = req.query; // default radius is 10 miles

    const user = await User.findById(userId);
    if (!user || !user.location || !user.location.coordinates.length) {
      return res.status(400).json({
        status: "failed",
        message: "User location is not set. Please set your location first.",
      });
    }
    const userLocation = {
      type: "Point",
      coordinates: user.location.coordinates,
    };

    // Convert radius from miles to meters (1 mile = 1609.34 meters)
    const radiusInMeters = radius * 1609.34;

    // Find nearby places
    const places = await NearByPlace.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            userLocation.coordinates, // [longitude, latitude]
            radiusInMeters / 6378100, // Radius in radians (6378100 meters is the Earth's radius)
          ],
        },
      },
    })
      .populate("placeType", "title")
      .populate("facilities", "title")
      .populate("createdBy", "firstname lastname")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Nearby places fetched successfully.",
      data: places,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching nearby places.",
      error: error.message,
    });
  }
};

// Get Nearby Places by Range and Place Type
exports.getNearbyPlacesByRangeAndType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { radius = 10, placeType } = req.query; // default radius is 10 miles

    if (!placeType) {
      return res.status(400).json({
        status: "failed",
        message: "placeType is required",
      });
    }
    if (isEmptyOrSpaces(placeType)) {
      return res.status(400).json({
        status: "failed",
        message: "placeType is required and cannot be empty or just spaces.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(placeType)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid PlaceType ID" });
    }
    const user = await User.findById(userId);
    if (!user || !user.location || !user.location.coordinates.length) {
      return res.status(400).json({
        status: "failed",
        message: "User location is not set. Please set your location first.",
      });
    }
    const userLocation = {
      type: "Point",
      coordinates: user.location.coordinates,
    };

    // Convert radius from miles to radians (Earth radius is approximately 6378100 meters)
    const radiusInRadians = (radius * 1609.34) / 6378100;

    // Find nearby places by range and place type
    const places = await NearByPlace.find({
      location: {
        $geoWithin: {
          $centerSphere: [userLocation.coordinates, radiusInRadians],
        },
      },
      placeType: placeType,
    })
      .populate("placeType", "title")
      .populate("facilities", "title")
      .populate("createdBy", "firstname lastname")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Nearby places fetched successfully.",
      data: places,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching nearby places.",
      error: error.message,
    });
  }
};

// Get Single NearByPlace by ID
exports.getSingleNearByPlace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid place ID.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User not found",
      });
    }
    // Find the place by ID
    const place = await NearByPlace.findById(id)
      .populate("placeType", "title")
      .populate("facilities", "title")
      .populate("createdBy", "firstname lastname");

    if (!place) {
      return res.status(404).json({
        status: "failed",
        message: "Place not found.",
      });
    }

    // Check if the logged-in user is the creator of the place
    if (place.createdBy._id.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "You do not have permission to view this place.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Place fetched successfully.",
      data: place,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching the place.",
      error: error.message,
    });
  }
};

// Toggle 'isActive' status for a NearByPlace
exports.togglePlaceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User not found",
      });
    }

    if (isEmptyOrSpaces(placeId)) {
      return res.status(400).json({
        status: "failed",
        message: "placeId is required and cannot be empty or just spaces.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid placeId ID" });
    }

    const place = await NearByPlace.findById(placeId);
    if (!place) {
      return res.status(404).json({
        status: "failed",
        message: "Place not found.",
      });
    }

    // Check if the logged-in user is the creator of the place
    // if (place.createdBy.toString() !== userId.toString()) {
    //   return res.status(403).json({
    //     status: "failed",
    //     message: "You do not have permission to update this place.",
    //   });
    // }

    // Toggle the 'isActive' status
    place.isActive = !place.isActive;

    await place.save();

    return res.status(200).json({
      status: "success",
      message: `Place status updated to ${place.isActive}.`,
      data: place,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating the place status.",
      error: error.message,
    });
  }
};

// Update a NearByPlace
exports.updateNearByPlace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.params;
    const { title, description, placeType, facilities, images, location } =
      req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User not found",
      });
    }

    if (isEmptyOrSpaces(placeId)) {
      return res.status(400).json({
        status: "failed",
        message: "placeId is required and cannot be empty or just spaces.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid placeId ID" });
    }

    const place = await NearByPlace.findById(placeId);
    if (!place) {
      return res.status(404).json({
        status: "failed",
        message: "Place not found.",
      });
    }
    if (place.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "failed",
        message: "You do not have permission to update this place.",
      });
    }

    if (title) place.title = title;
    if (description) place.description = description;

    if (placeType) {
      const validPlaceType = await PlaceType.findById(placeType);
      if (!validPlaceType) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid placeType.",
        });
      }
      place.placeType = placeType;
    }

    // Ensure facilities is an array
    if (facilities) {
      try {
        const facilitiesArray = JSON.parse(facilities);
        if (Array.isArray(facilitiesArray)) {
          place.facilities = facilitiesArray.filter((facility) =>
            mongoose.Types.ObjectId.isValid(facility)
          );
        }
      } catch (err) {
        return res.status(400).json({
          status: "failed",
          message: "Facilities should be a valid JSON array.",
        });
      }
    }

    if (images) {
      place.images = images.filter((image) => image && image.trim() !== "");
    }

    // Validate and update location
    if (location) {
      const { latitude, longitude } = location;
      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);

      if (isNaN(lat) || isNaN(long)) {
        return res.status(400).json({
          status: "failed",
          message:
            "Invalid location data. Latitude and longitude must be numbers.",
        });
      }

      place.location = {
        type: "Point",
        coordinates: [long, lat], // [longitude, latitude]
      };
    }

    // Save updated place
    await place.save();

    return res.status(200).json({
      status: "success",
      message: "Place updated successfully.",
      data: place,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating the place.",
      error: error.message,
    });
  }
};
