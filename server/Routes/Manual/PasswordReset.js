const ResetPasswordRoute = require('express').Router();
const UserModel = require('../../Database/Models/UserModel');
const AuthUtils = require('../../Utils/AuthUtils');
const sendEmail = require("../../Utils/EmailSender");

ResetPasswordRoute.post('/request-password-reset', async (req, res) => {
    //generate OTP
    const OTP = AuthUtils.generateOTP(6);
    //secure OTP
    const securedOTP = await AuthUtils.EncodeData(OTP);
    //Fetch UserData
    const userData = await UserModel.findOne({
        email: req.body.email
    })
    if (userData) {
        //Save secured OTP to DB
        userData.otp = securedOTP;
        await userData.save();

        //Send Raw OTP to user's email
        await sendEmail(req.body.email, " Password Reset Verification Code",
            `Dear ${userData.username},

We received a request to reset the password for your account. To ensure the security of your account, please use the following verification code to proceed with the password reset process:

Verification Code: ${OTP}

Please enter this code on the password reset page to verify your identity.

Thank you for using our services.`)
        res.status(200).json({
            message: "OK"
        })
    }

    else {
        res.status(404).json({
            message: "Email not found"
        })
    }



})

ResetPasswordRoute.post('/password-reset', async (req, res) => {
    try {
        const newPass = req.body.newPassword;
        const securedPassword = await AuthUtils.EncodeData(newPass);
        const userData = await UserModel.findOne({
            email: req.body.email
        });
        if (userData) {
            userData.password = securedPassword
            userData.save();
            //send confirmation email
            await sendEmail(req.body.email, " Password Update Successful",
                `Dear ${userData.username},

We're writing to inform you that your password has been successfully updated. Your account security is important to us, and we're pleased to confirm that the password change has been completed.

Thank you for choosing Ziventa for your needs.
`)
            res.status(200).json({
                message: "OK"
            })
        }
    }
    catch (error) {
        console.error(error);
        res.json({
            message: "Error",
            error: error
        })
    }
})

//exporting the Router
module.exports = ResetPasswordRoute;