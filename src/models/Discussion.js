const mongoose = require('mongoose');
var  userSchema = mongoose.model('User').schema;


const { Schema } = mongoose;

const DiscussionSchema = new Schema({
    creator: userSchema,
    members: [String],
    label: String,
}, {
        timestamps: true,
    });



const DiscussionModel = mongoose.model('Discussion', DiscussionSchema);
module.exports = { DiscussionModel };