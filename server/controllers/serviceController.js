const Service = require("../models/serviceModel");
const { uploadImage } = require("../utils/gcs");

exports.createService = async (req, res) => {
  try {
    const { name, description } = req.body;
    const file = req.file;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    if (!file) {
      return res.status(400).json({ message: "SVG icon is required" });
    }

    if (file.mimetype !== "image/svg+xml") {
      return res.status(400).json({ message: "Only .svg files are allowed" });
    }

    const fileName = `services/icons/${Date.now()}_${file.originalname}`;
    const iconUrl = await uploadImage(file.buffer, fileName, file.mimetype);

    const newService = await Service.create({
      name,
      description,
      iconUrl,
    });

    res.status(201).json({
      message: "Service created successfully",
      service: newService,
    });
  } catch (error) {
    console.error("Service creation error:", error);
    res.status(500).json({ message: "Server error creating service" });
  }
};
