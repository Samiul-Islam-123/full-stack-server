const express = require('express');
const VideoStreamingCreateRoutes = express.Router();
const { google } = require('googleapis');
const AuthUtils = require('../../../Utils/AuthUtils')

const apikeys = require('./../../../apikeys.json');
const PostModel = require('../../../Database/Models/VideoStreaming/PostModel');
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const fs = require("fs");
const keyFilename = './credentials.json'
const MediaModel = require('./../../../Database/Models/VideoStreaming/PostModel')

// Create a new instance of the Google Cloud Storage client
const storage = new Storage({ keyFilename });

// Configure multer for file upload
const upload = multer({ dest: "uploads/" });

const MAX_FILES = 10;



// Function to upload file to Google Drive

// POST endpoint for file upload
VideoStreamingCreateRoutes.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    try {
        const token = req.body.token;
        const DecodedToken = await AuthUtils.decodeToken(token);
        const bucketName = "staging.ultra-bearing-331411.appspot.com"; // Replace with your bucket name
      const bucket = storage.bucket(bucketName);

        const uploadedFiles = [];
        var videoUrl, thumbnailUrl;
        
        // Handle video upload
        if (req.files['video'] && req.files['video'].length > 0) {
            const videoFile = req.files['video'][0];
            const videoBlob = bucket.file(`${DecodedToken.user_id}/videos/${videoFile.originalname}`);
            const videoBlobStream = videoBlob.createWriteStream({
                metadata: {
                    contentType: videoFile.mimetype,
                },
            });

            await new Promise((resolve, reject) => {
                videoBlobStream.on("error", (err) => {
                    console.error("Error uploading video to Google Cloud Storage:", err);
                    reject(err);
                });

                videoBlobStream.on("finish", async () => {
                    videoUrl = `https://storage.googleapis.com/${bucketName}/${DecodedToken.user_id}/videos/${videoFile.originalname}`;
                    uploadedFiles.push({ url: videoUrl, type: 'video' });
                    fs.unlink(videoFile.path, (err) => {
                        if (err) console.error("Error deleting video file:", err);
                    });
                    resolve();
                });

                // Pipe the local video file to the Google Cloud Storage object
                fs.createReadStream(videoFile.path).pipe(videoBlobStream);
            });
        }

        // Handle thumbnail upload
        if (req.files['thumbnail'] && req.files['thumbnail'].length > 0) {
            const thumbnailFile = req.files['thumbnail'][0];
            const thumbnailBlob = bucket.file(`${DecodedToken.user_id}/thumbnails/${thumbnailFile.originalname}`);
            const thumbnailBlobStream = thumbnailBlob.createWriteStream({
                metadata: {
                    contentType: thumbnailFile.mimetype,
                },
            });

            await new Promise((resolve, reject) => {
                thumbnailBlobStream.on("error", (err) => {
                    console.error("Error uploading thumbnail to Google Cloud Storage:", err);
                    reject(err);
                });

                thumbnailBlobStream.on("finish", async () => {
                    thumbnailUrl = `https://storage.googleapis.com/${bucketName}/${DecodedToken.user_id}/thumbnails/${thumbnailFile.originalname}`;
                    uploadedFiles.push({ url: thumbnailUrl, type: 'thumbnail' });
                    fs.unlink(thumbnailFile.path, (err) => {
                        if (err) console.error("Error deleting thumbnail file:", err);
                    });
                    resolve();
                });

                // Pipe the local thumbnail file to the Google Cloud Storage object
                fs.createReadStream(thumbnailFile.path).pipe(thumbnailBlobStream);
            });
        }


        // After all files are uploaded, save URLs to MongoDB
        const mediaDocuments = uploadedFiles.map(file => ({
            owner: DecodedToken.user_id,
            thumbnailURL : thumbnailUrl,
            downloadableVideoURL : videoUrl,
            title : req.body.title,
            description : req.body.description
        }));

        await MediaModel.insertMany(mediaDocuments);
        

        

        // Send the URLs in the response
        res.json({ success: true});
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = VideoStreamingCreateRoutes;
