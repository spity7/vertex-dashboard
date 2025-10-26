const express = require("express");
const multer = require("multer");
const router = express.Router();
const { createService } = require("../controllers/serviceController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/services", upload.single("icon"), createService);

module.exports = router;
