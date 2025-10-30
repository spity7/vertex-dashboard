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

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Server error fetching project" });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, category, description, location } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0];
    const galleryFiles = req.files?.gallery || [];

    // ✅ Find existing project first
    const existingProject = await Project.findById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updateData = { name, category, description, location };

    // ✅ Handle new thumbnail upload
    if (thumbnailFile) {
      // Delete old thumbnail if exists
      if (existingProject.thumbnailUrl) {
        try {
          await deleteImage(existingProject.thumbnailUrl);
        } catch (err) {
          console.warn("⚠️ Failed to delete old thumbnail:", err.message);
        }
      }

      // Upload new one
      const newThumbnailName = `projects/thumbnails/${Date.now()}_${
        thumbnailFile.originalname
      }`;
      const newThumbnailUrl = await uploadImage(
        thumbnailFile.buffer,
        newThumbnailName,
        thumbnailFile.mimetype
      );
      updateData.thumbnailUrl = newThumbnailUrl;
    }

    // ✅ Handle new gallery uploads (OPTION 1: append new images)
    const newGalleryUrls = [];
    for (const file of galleryFiles) {
      const fileName = `projects/gallery/${Date.now()}_${file.originalname}`;
      const imageUrl = await uploadImage(file.buffer, fileName, file.mimetype);
      newGalleryUrls.push(imageUrl);
    }

    if (newGalleryUrls.length > 0) {
      // Option 1: append new gallery images
      updateData.gallery = [
        ...(existingProject.gallery || []),
        ...newGalleryUrls,
      ];
    }

    // ✅ Update project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      message: "Server error updating project",
      error: error.message,
    });
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

exports.deleteProjectImage = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const { imageUrl } = req.body; // the image URL to delete

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the image exists in the project's gallery
    const imageExists = project.gallery.includes(imageUrl);
    if (!imageExists) {
      return res.status(404).json({ message: "Image not found in gallery" });
    }

    // Delete the image from GCS
    await deleteImage(imageUrl);

    // Remove the image from MongoDB array
    project.gallery = project.gallery.filter((url) => url !== imageUrl);
    await project.save();

    res.status(200).json({
      message: "Gallery image deleted successfully",
      gallery: project.gallery,
    });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({
      message: "Server error deleting gallery image",
      error: error.message,
    });
  }
};
