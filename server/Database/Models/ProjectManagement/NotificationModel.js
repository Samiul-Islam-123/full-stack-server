const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
    sender : {
        type : mongoose.Schema.ObjectId,
        ref : "user"
    },
    receiver : {
        type : mongoose.Schema.ObjectId,
        ref : "user"
    },
    seen : Boolean,
    content : String
});
const NotificationModel = new mongoose.model('notification', NotificationSchema);

module.exports = NotificationModel