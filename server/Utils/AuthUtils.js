const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const EncodeData = async (data) => {
    try {
        //generate salt
        const salt = await bcrypt.genSalt(10);
        //encoding Data
        const encodedData = await bcrypt.hash(data, salt);
        //returning the data
        return encodedData;

    }
    catch (error) {
        //handling the error
        return error
    }
}

//function to generate OTP
function generateOTP(length) {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits[randomIndex];
    }

    return otp;
};

const VerifyData = async (encodedData, actualData) => {
    try {
        const verified = await bcrypt.compare(actualData, encodedData);;
        return verified;
    }
    catch (error) {
        return error;
    }
}

const generateAuthToken = (credentials) => {
    const token = jwt.sign(credentials,
        process.env.SECRET, {
        expiresIn: "720hr"
    });

    return token;
}

const decodeToken = async (token) => {
    const decodedToken = await jwt.verify(token, process.env.SECRET);
    return decodedToken
}

//exporting all the functions
module.exports = {
    EncodeData,
    generateOTP,
    VerifyData,
    generateAuthToken,
    decodeToken
}