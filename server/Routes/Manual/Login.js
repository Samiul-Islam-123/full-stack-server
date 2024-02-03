const UserModel = require('../../Database/Models/UserModel');
const AuthUtils = require('../../Utils/AuthUtils')
const LoginRoute = require('express').Router();

//login logic
LoginRoute.post('/login', async (req, res) => {
    try {
        const UserData = await UserModel.findOne({
            email: req.body.email
        });
        if (!UserData)
            res.json({
                message: "Email not found"
            })

        else {
            if (await AuthUtils.VerifyData(UserData.password, req.body.password)) {
                //generating token
                const token = AuthUtils.generateAuthToken({
                    user_id: UserData._id,
                    username: UserData.username,
                    email: UserData.email,
                    verified: UserData.verified
                })
                res.json({
                    message: "Logged in successfully",
                    token: token
                })
            }
            else
                res.json({
                    message: "Wrong password"
                })
        }
    }
    catch (error) {
        console.error(error);
        res.json({
            message: "error",
            error: error
        })
    }
})

//exporting Login Route
module.exports = LoginRoute;