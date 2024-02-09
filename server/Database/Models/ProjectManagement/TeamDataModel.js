const mongoose = require('mongoose');

const TeamDataSchema = new mongoose.Schema({
    TeamName : {
        type : String,
        required: true
    },
    TeamDescription : String,
    TeamLeader : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    Members : [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            },
            role: {
                type: String
            }
        },
    ],

    TeamBannerURL : String,

    Todos : [
        {
            Task : String,
            Completed : Boolean,
            Date : Date
        }
    ]
});

const TeamDataModel = new mongoose.model('team', TeamDataSchema);

module.exports = TeamDataModel;