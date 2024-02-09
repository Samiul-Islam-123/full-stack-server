const express = require('express');
const TeamDataModel = require('../../../Database/Models/ProjectManagement/TeamDataModel');
const PostRoutes = express.Router();
const AuthUtils = require('./../../../Utils/AuthUtils')

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
            Message : `Team ${req.body.TeamName} created successfully`
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
})

module.exports = PostRoutes;