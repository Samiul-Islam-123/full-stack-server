const express = require('express');
const TeamDataModel = require('../../../Database/Models/ProjectManagement/TeamDataModel');
const PostRoutes = express.Router();
const AuthUtils = require('./../../../Utils/AuthUtils');
const ChatModel = require('../../../Database/Models/ProjectManagement/ChatModel');
const WhiteBoardModel = require('../../../Database/Models/ProjectManagement/WhiteBoardModel');
const MediaModel = require('../../../Database/Models/ProjectManagement/MediaModel');
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const fs = require("fs");
const keyFilename = './credentials.json'


// Create a new instance of the Google Cloud Storage client
const storage = new Storage({ keyFilename });

// Configure multer for file upload
const upload = multer({ dest: "uploads/" });

const MAX_FILES = 10;


PostRoutes.post('/create-team', async(req,res)=>{
    try{

        //extracting Leader ID
        const token = req.body.token;
        const decodedToken = await AuthUtils.decodeToken(token);
        const LeaderID = decodedToken.user_id;

        //creating intial MembersList
        const MembersList = [{
            user : LeaderID,
            role : "Leader"
        }]

        const BannerURL = req.body.TeamBannerURL ? ('req.body.TeamBannerURL') : `https://img.freepik.com/free-vector/fluid-shape-abstract-background-with-text-space-vector_1017-43420.jpg?w=1380&t=st=1707486901~exp=1707487501~hmac=a7c14116f21624e902fd81d5a7d26b0b8ae287af8db715138d0d66f6dd8cf868`

        const TeamData = new TeamDataModel({
            TeamName : req.body.TeamName,
            TeamDescription : req.body.TeamDescription,
            TeamLeader : LeaderID,
            Members: MembersList,
            TeamBannerURL : BannerURL
        })

        //save the team
        await TeamData.save();

        res.json({
            success : true,
            Message : `Team ${req.body.TeamName} created successfully`,
            teamID : TeamData._id
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

PostRoutes.post('/request-to-join', async(req,res)=>{
    const token = req.body.token;
    const decodedtoken = await AuthUtils.decodeToken(token);
    const senderID = decodedtoken.user_id;
    const receiverID = req.body.receiverID;
    const TeamID = req.body.TeamID;
    try{
        const currentTeamData = await TeamDataModel.findOne({
            _id : TeamID
        });
        if(currentTeamData)
            {
                currentTeamData.Requests.push({
                    sender : senderID,
                    receiver : receiverID,
                    accepted : false
                })

                await currentTeamData.save();
                res.json({
                    success : true,
                    message : "Request Sent"
                })
            }

            else{
                res.json({
                    success : true,
                    message : "No team data found"
                })
            }
    }
    catch(error){
        console.error(error);
        return res.send({success: false, message: 'Error occured while making request'})
    }
})

PostRoutes.post('/create-chat-room', async(req,res)=>{
    try{
        const TeamID = req.body.TeamID;
        const currentChatRoom = new ChatModel({
            Team : TeamID
        })
        await currentChatRoom.save();
        res.json({
            success : true,
            message : "OK"
        })
    }
    catch(error){
        console.log(error);
        res.json({
            success : false,
            message : "Error occured"
        })
    }
})

//routes for media
PostRoutes.post('/add-media', upload.array('files', MAX_FILES), async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided." });
    }
  
    try {
      const token = req.body.token;
      const DecodedToken = await AuthUtils.decodeToken(token);
      const bucketName = "staging.ultra-bearing-331411.appspot.com"; // Replace with your bucket name
      const bucket = storage.bucket(bucketName);
  
      const uploadedFiles = [];
  
      // Promise.all to wait for all uploads to complete
      await Promise.all(req.files.map(async (file) => {
        const blob = bucket.file(`${DecodedToken.user_id}/${file.originalname}`);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });
  
        await new Promise((resolve, reject) => {
          blobStream.on("error", (err) => {
            console.error("Error uploading file to Google Cloud Storage:", err);
            reject(err);
          });
  
          blobStream.on("finish", async () => {
            const url = `https://storage.googleapis.com/${bucketName}/${DecodedToken.user_id}/${file.originalname}`;
            uploadedFiles.push(url);
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting file:", err);
            });
            resolve();
          });
  
          // Pipe the local file to the Google Cloud Storage object
          fs.createReadStream(file.path).pipe(blobStream);
        });
      }));
  
      // After all files are uploaded, save URLs to MongoDB
      const mediaDocuments = uploadedFiles.map(url => ({
        contentURL: url,
        uploadedBy: DecodedToken.user_id,
        timestamp: new Date().getTime(),
        fileName: url.substring(url.lastIndexOf('/') + 1)
      }));
  
      await MediaModel.insertMany(mediaDocuments);
  
      return res.json({
        success: true,
        message: "Media uploaded successfully"
      });
    } catch (error) {
      console.error(error);
      res.json({
        success: false,
        message: "error",
        error: error,
      });
    }
  });
  

module.exports = PostRoutes;