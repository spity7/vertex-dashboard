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

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error fetching projects" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Delete thumbnail from GCS
    if (project.thumbnailUrl) {
      await deleteImage(project.thumbnailUrl);
    }

    // Delete all gallery images from GCS (if any)
    if (Array.isArray(project.gallery) && project.gallery.length > 0) {
      await Promise.all(
        project.gallery.map(async (imageUrl) => {
          try {
            await deleteImage(imageUrl);
          } catch (err) {
            console.warn("⚠️ Failed to delete gallery image:", err.message);
          }
        })
      );
    }

    // Delete project from MongoDB
    await project.deleteOne();

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Server error deleting project" });
  }
};
