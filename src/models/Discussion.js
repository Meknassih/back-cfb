const mongoose = require('mongoose');
var  userSchema = mongoose.model('User').schema;


const { Schema } = mongoose;

const DiscussionSchema = new Schema({
    creator: String,
    members: [String],
    label: String,
}, {
        timestamps: true,
    });



const DiscussionModel = mongoose.model('Discussion', DiscussionSchema);
module.exports = { DiscussionModel };