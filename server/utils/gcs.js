const { Storage } = require("@google-cloud/storage");
const path = require("path");
require("dotenv-safe").config();

const keyPath =
  process.env.GCS_KEYFILE || path.join(__dirname, "../gcs-key.json");

const storage = new Storage({ keyFilename: keyPath });

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

async function uploadImage(fileBuffer, fileName, mimeType) {
  const file = bucket.file(fileName);

  // Save the file (no ACL manipulation)
  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
    },
    resumable: false,
  });

  // Return public URL:
  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
    fileName
  )}`;
}

module.exports = { uploadImage, bucket };
