const mongoose = require('mongoose');
const { Schema } = mongoose;
const MessageSchema = new Schema({
    author: Schema.Types.ObjectId,
    message: String,
    discussion: { type: Schema.Types.ObjectId, ref: 'DiscussionModel' }
}, {
        timestamps: true,
    }
);
const { DiscussionSchema, DiscussionModel } = require('./Discussion');

MessageSchema.statics.getMessagesInDiscussion = function (discussionId, userId, cb, options) {
    if (!options)
        options = {count:30, offset:0};
    if (!options.count)
        options.count = 30;
    if (!options.offset)
        options.offset = 0;
    DiscussionModel.findById(mongoose.Types.ObjectId(discussionId), function (err, discussion) {
        if (err)
            return cb(err);

        if (discussion) {
            if (discussion.members.findIndex(m => (m.toString() == userId))<0
            && discussion.creator.toString() != userId)
                return cb('notAllowed');

            mongoose.model('Message').find({discussion: discussion._id}, '-__v', {limit: options.count, skip: options.offset} ,function(err, messages) {
                if (err)
                    return cb(err);

                for (let i=0; i<messages.length; i++) {
                    messages[i] = messages[i].toObject();
                    messages[i].dateTime = messages[i].createdAt;
                    messages[i].id = messages[i]._id;
                }
                return cb(null, messages, discussion);
            });
        } else {
            return cb('notFound');
        }
    });
};

MessageSchema.statics.postMessageInDiscussion = function (discussionId, userId, message, cb) {
    DiscussionModel.findById(mongoose.Types.ObjectId(discussionId), function (err, discussion) {
        if (err)
            return cb(err);

        if (discussion) {
            // Vérifier si l'utilisateur est autorisé à envoyer un message (membre / créateur de la discussion)
            if (discussion.members.findIndex(m => (m.toString() == userId))<0
                && discussion.creator.toString() != userId)
                return cb('notAllowed');

            let dataMessage  = {author: userId, message: message, discussion: discussionId};
            // Enregistrement du message
            mongoose.model('Message').create(dataMessage, function (err, createdMessage) {
                if (err)
                    return cb(err);
                return cb(null, createdMessage, discussion);
            });
        } else {
            return cb('notFound');
        }
    });
};


const MessageModel = mongoose.model('Message', MessageSchema);
module.exports = { MessageModel, MessageSchema };
