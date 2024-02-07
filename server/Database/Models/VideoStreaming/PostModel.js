const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    thumbnailURL : String,
    downloadableVideoURL : String,
    title : String,
    description : String
});
const PostModel = new mongoose.model('video', PostSchema);
module.exports = PostModel;