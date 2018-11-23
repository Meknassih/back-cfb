const mongoose = require('mongoose');
const { Schema } = mongoose;
const MessageSchema = new Schema({
    author: Schema.Types.ObjectId,
    message: String,
    discussion: {type: Schema.Types.ObjectId, ref: 'DiscussionModel'}
}, {
        timestamps: true,
    }
);
const { UserModel, UserSchema } = require('./User');

//TODO: TEC12
MessageSchema.statics.getMessages = function (discussionId, options, cb) {
    
};

MessageSchema.statics.getMessages = function (discussionId, cb) {
    MessageSchema.getMessages(discussionId, {count: 30, offset:0}, cb);
};
//TODO: TEC13

const MessageModel = mongoose.model('Message', MessageSchema);
module.exports = { MessageModel, MessageSchema };