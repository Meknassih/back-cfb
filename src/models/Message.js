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

//TODO: TEC12
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
//TODO: TEC13

MessageSchema.statics.register = function (author, message, discution) {
    if (author) {
        return this.findOne({ author: username }, (err, existingUser) => {
            if (err)
                return cb(err);
                  mongoose.model('Message').create({ author: username, message: message, discution: discution}, function (err, user) {
                      if (err) {
                          cb(err);
                      } else {
                          cb(null, user);
                      }
                  });
                    }
                });
            }
        });
}



const MessageModel = mongoose.model('Message', MessageSchema);
module.exports = { MessageModel, MessageSchema };
