const mongoose = require('mongoose');
const { Schema, Types } = mongoose;
const MessageSchema = new Schema({
    author: Types.ObjectId,
    message: String
}, {
        timestamps: true,
    }
);
const { UserModel, UserSchema } = require('./User');

//TODO: TEC12

//TODO: TEC13

const MessageModel = mongoose.model('Message', MessageSchema);
module.exports = { MessageModel, MessageSchema };