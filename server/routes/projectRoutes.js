const express = require("express");
const multer = require("multer");
const router = express.Router();
const { createProject } = require("../controllers/projectController");

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

module.exports = router;
