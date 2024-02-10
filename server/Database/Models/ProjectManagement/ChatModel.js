const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
    Team : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "team"
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    content: String,
    timestamp: Date,
    seenBy: [{
        users: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    }
    ]
})
const ChatModel = new mongoose.model('chat', ChatSchema);
module.exports = ChatModel;