const Project = require("../models/projectModel");
const { uploadImage, deleteImage } = require("../utils/gcs");

exports.createProject = async (req, res) => {
  try {
    const { name, category, description, location } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0];
    const galleryFiles = req.files?.gallery || [];

    if (!name || !category || !description || !location) {
      return res.status(400).json({
        message: "Name, category, description, and location are required",
      });
    }

    if (!thumbnailFile) {
      return res.status(400).json({ message: "Thumbnail image is required." });
    }

    // Upload thumbnail
    const thumbnailFileName = `projects/thumbnails/${Date.now()}_${
      thumbnailFile.originalname
    }`;
    const thumbnailUrl = await uploadImage(
      thumbnailFile.buffer,
      thumbnailFileName,
      thumbnailFile.mimetype
    );

    // Upload gallery (optional)
    const galleryUrls = [];
    for (const file of galleryFiles) {
      const fileName = `projects/gallery/${Date.now()}_${file.originalname}`;
      const imageUrl = await uploadImage(file.buffer, fileName, file.mimetype);
      galleryUrls.push(imageUrl);
    }

    // Save project to DB
    const newProject = await Project.create({
      name,
      category,
      description,
      location,
      thumbnailUrl,
      gallery: galleryUrls,
    });

    res.status(201).json({
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error) {
    console.error("Project creation error:", error);
    res.status(500).json({
      message: "Server error creating project",
      error: error.message,
    });
  }
};
