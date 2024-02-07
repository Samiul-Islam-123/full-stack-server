const express = require('express');
const VideoStreamingCreateRoutes = express.Router();
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');
const AuthUtils = require('../../../Utils/AuthUtils')

const apikeys = require('./../../../apikeys.json');
const PostModel = require('../../../Database/Models/VideoStreaming/PostModel');
const SCOPE = ['https://www.googleapis.com/auth/drive'];

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // Destination folder for storing uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original filename for storing the file
    }
});

const upload = multer({ storage: storage });

// Function to authorize Google Drive API
async function authorize() {
    const jwtClient = new google.auth.JWT(
        apikeys.client_email,
        null,
        apikeys.private_key.replace(/\\n/g, '\n'),
        SCOPE
    );
    await jwtClient.authorize();
    return jwtClient;
}

// Function to upload file to Google Drive
async function uploadFile(authClient, file) {
    return new Promise((resolve, reject) => {
        const drive = google.drive({ version: 'v3', auth: authClient });
        const fileMetaData = {
            name: file.originalname,
            parents: ['1CqJzakHa18kgExxadnFqm9YWPAezsVD4'] // Replace '<PARENT_FOLDER_ID>' with the actual parent folder ID
        };
        const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path)
        };
        drive.files.create({
            resource: fileMetaData,
            media: media
        }, function (error, createdFile) {
            // Close the file stream
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error('Error deleting temporary file:', err);
                }
            });
            if (error) {
                return reject(error);
            }
            resolve(createdFile);
        });
    });
}

// POST endpoint for file upload
VideoStreamingCreateRoutes.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    try {
        const authClient = await authorize();
        
        // Upload video file to Google Drive
        const videoFile = req.files['video'][0];
        const uploadedVideo = await uploadFile(authClient, videoFile);
        const videoFileId = uploadedVideo.data.id;
        const videoUrl = `https://drive.google.com/file/d/${videoFileId}`;

        // Upload thumbnail image to Google Drive
        const thumbnailFile = req.files['thumbnail'][0];
        const uploadedThumbnail = await uploadFile(authClient, thumbnailFile);
        const thumbnailFileId = uploadedThumbnail.data.id;
        const thumbnailUrl = `https://drive.google.com/file/d/${thumbnailFileId}`;

        // Save data into MongoDB
        //console.log(req.body)
        const token = req.body.token;
        
        const decodedToken = await AuthUtils.decodeToken(token);

        const currentVideoPost = new PostModel({
            owner: decodedToken.user_id,
            thumbnailURL: thumbnailUrl,
            downloadableVideoURL: videoUrl,
            title: req.body.title,
            description: req.body.description
        });

        // Save the currentVideoPost into MongoDB
        await currentVideoPost.save();

        // Send the URLs in the response
        res.json({ success: true, videoUrl: videoUrl, thumbnailUrl: thumbnailUrl });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = VideoStreamingCreateRoutes;
