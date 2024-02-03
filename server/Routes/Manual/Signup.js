const SignupRoute = require('express').Router();
const AuthUtils = require('../../Utils/AuthUtils');
const UserModel = require(`./../../Database/Models/UserModel`);
const sendEmail = require('../../Utils/EmailSender');

//creating Signup routes
SignupRoute.post('/signup', async (req, res) => {
    try {
        //checking for already existing user
        const PreviousUser = await UserModel.findOne({
            email: req.body.email
        })
        if (PreviousUser)
            res.json({
                message: "User Already exists"
            })

        else {
            //securing password
            const SecuredPassword = await AuthUtils.EncodeData(req.body.password);
            //generate otp
            const OTP = AuthUtils.generateOTP(6);
            //securing OTP
            const securedOTP = await AuthUtils.EncodeData(OTP);
            //creating new user
            const CurrentUser = new UserModel({
                username: req.body.username,
                email: req.body.email,
                password: SecuredPassword,
                verified: false,
                otp: securedOTP
            });
            //save user credentials
            await CurrentUser.save();
            //sending verification email
            await sendEmail(req.body.email, "Email Verification", `
            Dear ${req.body.username},

            We're excited to welcome you to Ziventa! To ensure the security of your account and complete the registration process, please verify your email address by providing the One-Time Password (OTP) below:
            OTP: ${OTP}
            Please enter this OTP in the verification field on the registration page to complete your account setup.
            If you did not attempt to create an account with Ziventa, please disregard this email.

            Thank you for choosing us. We look forward to having you as part of our community!
        `)
            //send response
            res.status(200).json({
                message: "OK"
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

//exporting Signup route
module.exports = SignupRoute;