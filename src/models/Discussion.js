const mongoose = require('mongoose');
const { Schema } = mongoose;
const DiscussionSchema = new Schema({
    creator: String,
    members: [mongoose.Schema.Types.ObjectId],
    label: String,
}, {
        timestamps: true,
    });
const { UserModel } = require('../models/User');

DiscussionSchema.statics.getDiscussion = function (conditions, cb) {
    this.findOne({ conditions }, function (err, discussion) {
        if (err)
            return cb(err);

        if (discussion) {
            UserModel.findById(discussion.creator, function (err, creator) {
                if (err)
                    return cb(err);

                discussion.creator = creator;
                for (let i = 0; i < discussion.members.length; i++) {
                    UserModel.findById(discussion.members[i], function (err, member) {
                        if (err)
                            return cb(err);

                        discussion.members[i] = member;
                        if (i === discussion.members.length - 1)
                            cb(null, discussion);
                    });
                }
            });
        } else {
            let newDiscussion = { creator: conditions.creator };
            if (conditions.members)
                newDiscussion.members = conditions.members;
            else
                newDiscussion.members = [];
            if (conditions.label)
                newDiscussion.label = conditions.label;

            this.create(newDiscussion, function (err, discussion) {
                if (err)
                    return cb(err);
                    
                cb(null, discussion);
            });
        }
        cb(null, discussion);
        /* if (!discussion) {
            if (members == undefined) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0004',
                    description: 'Une discussion doit décrire des membres'
                }));
                res.end();
            } else if (Array.isArray(members) && members.length > 9) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0005',
                    description: 'Trop de membres tuent les membres'
                }));
                res.end();
            } else {
                mongoose.model('Discussion').create({ creator: creator, members: members, label: label }, function (err2, discussion2) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'discussion',
                        code: 'T0007',
                        description: 'Création d\'une discussion',
                        payload: discussion2
                    }));
                    res.end();

                });
            }
        } else {
            // La discussion existe => on la retourne au client
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'discussion',
                code: 'T0006',
                description: 'Récupération d\'une discussion existante',
                payload: discussion
            }));
            res.end();
        } */
    });
}

const DiscussionModel = mongoose.model('Discussion', DiscussionSchema);
module.exports = { DiscussionModel, DiscussionSchema };