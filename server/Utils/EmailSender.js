const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: `${process.env.USER}`,
            pass: `${process.env.PASS}`,
        },
    });

    await transporter.sendMail(
        {
            from: `${process.env.USER}`,
            to: to,
            subject: subject,
            text: text,
        },
        (error) => {
            if (error) console.log(error);
            else console.log("email send...");
        }
    );
};

module.exports = sendEmail;