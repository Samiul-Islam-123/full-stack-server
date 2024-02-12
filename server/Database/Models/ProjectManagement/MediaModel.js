const mongoose = require('mongoose');
const MediaSchema = new mongoose.Schema({
    contentURL : String,
    uploadedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    timestamp : Date,
    fileName : String
});
const MediaModel = new mongoose.model('media', MediaSchema);
module.exports = MediaModel;