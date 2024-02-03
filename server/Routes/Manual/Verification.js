const VerificationRoute = require('express').Router();
const UserModel = require('../../Database/Models/UserModel');
const AuthUtils = require('./../../Utils/AuthUtils')

VerificationRoute.post('/verify', async (req, res) => {
    //verification logic

    const UserData = await UserModel.findOne({
        email: req.body.email
    })

    if (UserData) {


        if (await AuthUtils.VerifyData(UserData.otp, req.body.otp)) {

            UserData.verified = true;
            UserData.otp = "";
            //save changes
            await UserData.save();
            res.status(200).json({
                message: "OK"
            })
        }
        else {
            res.json({
                message: "OTP not verified"
            })
        }

    }
    else {
        res.json({
            message: "Wrong Email ID"
        })
    }
})

module.exports = VerificationRoute;