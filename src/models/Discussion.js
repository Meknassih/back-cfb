const mongoose = require('mongoose');
const { Schema, Types } = mongoose;
const { UserModel, UserSchema } = require('../models/User');
const DiscussionSchema = new Schema({
    creator: Types.ObjectId,
    members: [{type: Schema.Types.ObjectId, ref: 'UserModel'}],
    label: String,
}, {
        timestamps: true,
    });

DiscussionSchema.statics.deleteById = function (discussionId, cb) {
    this.deleteOne({ _id: discussionId }, function (err) {
        if (err)
            return cb(err);
    });
    cb(null);
};

DiscussionSchema.statics.getOrCreateDiscussion = function (conditions, cb) {
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

            // console.log('found discussion ', discussion);
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

DiscussionSchema.statics.getUserInvolvedDiscussions = function (userId, cb) {
    mongoose.model('Discussion').find({
        $or: [
            {creator: mongoose.Types.ObjectId(userId)},
            {members: mongoose.Types.ObjectId(userId)}
            ]
        }, '-__v', function (err, discussions) {
        if (err)
            return cb(err);
        // console.log('found discussions ', discussions);
        
        for(let i=0; i<discussions.length; i++) {
            discussions[i] = discussions[i].toObject({minimize: false});
            discussions[i].id = discussions[i]._id;
            discussions[i].description = discussions[i].label;
            discussions[i].label = discussions[i].label;
            discussions[i].name = discussions[i].label;
            if (discussions[i].creator == userId)
                discussions[i].status = 'creator';
            else 
                discussions[i].status = 'member';
        }

        return cb(null, discussions);
    });
}

const DiscussionModel = mongoose.model('Discussion', DiscussionSchema);
module.exports = { DiscussionModel, DiscussionSchema };