const mongoose = require('mongoose');
const { Schema, Types } = mongoose;
const DiscussionSchema = new Schema({
    creator: Types.ObjectId,
    members: [mongoose.Schema.Types.ObjectId],
    label: String,
}, {
        timestamps: true,
    });
const { UserModel, UserSchema } = require('../models/User');

DiscussionSchema.statics.getDiscussion = function (conditions, cb) {
    UserModel.findById(conditions.creator, '-__v -password', function (err, creator) {
        if (err)
            return cb(err);
        // console.log('found user ', creator);
        if (!conditions.label)
            delete conditions.label;
            
        if (conditions.members) {
            let wholeMembers = [];
            conditions.members.forEach(m => {
                UserModel.findById(m, '-__v -password', function (err, wholeMember) {
                    if (err)
                        return cb(err);

                    wholeMembers.push(wholeMember);
                });
            });
            conditions.members = wholeMembers;
        } else
            delete conditions.members;
        conditions.creator = Types.ObjectId(conditions.creator);
        mongoose.model('Discussion').findOne(conditions, '-__v', function (err, discussion) {
            if (err)
                return cb(err);

            console.log('found discussion ',discussion);
            if (discussion) {
                discussion.creator = creator;
                discussion.members = conditions.members ? conditions.members : [];
                // console.log('Returning exist ', discussion);
                cb(null, discussion, false);
            } else {
                let newDiscussion = { creator: creator.id }; // Put only creator ID to register into db
                newDiscussion.members = conditions.members ? conditions.members : [];
                if (conditions.label)
                    newDiscussion.label = conditions.label;

                mongoose.model('Discussion').create(newDiscussion, function (err, createdDiscussion) {
                    if (err)
                        return cb(err);

                    createdDiscussion.__v = undefined; createdDiscussion.creator = creator; // Readd creator whole object
                    // console.log('returning new ', createdDiscussion);
                    cb(null, discussion, true);
                });
            }
        });
    });
}

const DiscussionModel = mongoose.model('Discussion', DiscussionSchema);
module.exports = { DiscussionModel, DiscussionSchema };