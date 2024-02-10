const express = require('express');
const TeamDataModel = require('../../../Database/Models/ProjectManagement/TeamDataModel');
const PostRoutes = express.Router();
const AuthUtils = require('./../../../Utils/AuthUtils');
const ChatModel = require('../../../Database/Models/ProjectManagement/ChatModel');
const WhiteBoardModel = require('../../../Database/Models/ProjectManagement/WhiteBoardModel');

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

PostRoutes.post('/create-board', async(req,res)=>{
    try {
        const decodedToken = await AuthUtils.decodeToken(req.body.token);
        const boardData = new WhiteBoardModel({
            Team : req.body.teamID,
            createdBy : decodedToken.user_id,
            timestamp : new Date().getTime(),
            BoardData : req.body.BoardData
        })
        await boardData.save();
        res.json({
            success : true,
            message : "Board Data saved succesfully"
        })
    }
    catch(error){
        console.log(error);
        res.json({
            success : false,
            message : 'Error occured while creating board'
        })
    }
})

module.exports = PostRoutes;