const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  deleteProjectImage,
} = require("../controllers/projectController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/projects",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 30 },
  ]),
  createProject
);
router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);
router.put(
  "/projects/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 30 },
  ]),
  updateProject
);
router.delete("/projects/:id", deleteProject);
router.delete("/projects/:id/gallery", deleteProjectImage);

module.exports = router;
