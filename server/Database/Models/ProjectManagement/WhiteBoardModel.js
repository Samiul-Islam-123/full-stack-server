const mongoose = require('mongoose');
const whiteBoardSchema = new mongoose.Schema({
    Team : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "team"
    },
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    timestamp : Date,
    BoardData : String
})
const WhiteBoardModel = new mongoose.model('board', whiteBoardSchema);

module.exports = WhiteBoardModel;