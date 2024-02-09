const TeamDataModel = require('../../../Database/Models/ProjectManagement/TeamDataModel');
const AuthUtils = require('../../../Utils/AuthUtils')
const FetchRoute = require('express').Router();
const UserModel = require('./../../../Database/Models/UserModel')

FetchRoute.get('/get-teams', async(req,res)=>{
    try{
        const token = req.headers.authorization;
        if(!token) return res.status(401).send({error: 'Token missing'});

        const decodedToken = await AuthUtils.decodeToken(token);
        const myID = decodedToken.user_id
        const myTeams = await TeamDataModel.find({
            $or : [
                {TeamLeader : myID},
                {Members : {
                    $elemMatch : 
                    {user : myID}
                }}
            ]
        }).populate('Members.user')

        res.json({
            success : true,
            MyTeams : myTeams
        })

    }
    catch(error){
        console.log("Error found while Fetching teams : "+error)
        res.json({
            message : "error",
            error : error
        })
    }
})

FetchRoute.get('/get-teams-id/:teamID', async(req,res)=>{
    try{

        const myTeams = await TeamDataModel.find({
            _id : req.params.teamID
        }).populate('Members.user')

        res.json({
            success : true,
            MyTeams : myTeams
        })

    }
    catch(error){
        console.log("Error found while Fetching teams : "+error)
        res.json({
            message : "error",
            error : error
        })
    }
})

FetchRoute.get('/search-user/:query', async (req, res) => {
    try {
        let userQuery = req.params.query;
        
        // Use regular expression for case-insensitive search
        const usersFound = await UserModel.find({
            username: { $regex: userQuery, $options: 'i' }
        });

        res.json({
            success: true,
            UsersFound: usersFound
        });
    } catch (error) {
        console.log("Error in search user: ", error);
        return res.status(400).send("There was a problem with your request. Please try again.");
    }
});

module.exports = FetchRoute;