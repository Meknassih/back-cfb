const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UserSchema = new Schema({
    login: String,
    password: String,
    email: String,
    salt: String,
    avatarUrl: String,
    isOnline: Boolean,
    lastSeen: Date,
    confirmed: Boolean
}, {
        timestamps: true,
    });


UserSchema.methods.generateJWT = function () {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        login: this.username,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
};


UserSchema.methods.toAuthJSON = function () {
    return {
        _id: this._id,
        login: this.username,
        email: this.email,
        avatarUrl: this.avatarUrl,
        lastSeen: this.lastSeen,
        token: this.generateJWT(),
    };
};

UserSchema.methods.setEmailConfirmed = function (cb) {
    this.confirmed = true;
    this.save(function (err, user) {
        if (err)
            return cb(err);
        else
            cb(null, user.email);
    });
}

UserSchema.methods.setOnline = function (cb) {
    this.isOnline = true;
    this.updatedAt = new Date();
    this.lastSeen = new Date();
    this.replaceOne(this, { upsert: true, timestamps: false }, function (err, savedUser) {
        if (err)
            return cb(err);
        cb(null, savedUser);
    });
}

UserSchema.statics.login = function (username, plainPassword, cb) {
    return this.findOne({ login: username, password: plainPassword }, cb);
}

UserSchema.statics.getByUsername = function (username, withSecrets, cb) {
    if (withSecrets)
        return mongoose.model('User').findOne({ login: username}, cb);
    else
        return mongoose.model('User').findOne({ login: username}, '-password -__v',cb);
}

UserSchema.statics.register = function (username, plainPassword, email, cb) {
    if (username && plainPassword && email) {
        return this.findOne({ login: username }, (err, existingUser) => {
            if (err)
                return cb(err);
            if (existingUser)
                return cb('User with username ' + existingUser.login + ' exists.');
            else {
                this.findOne({ email: email }, (err, existingUser) => {
                    if (err)
                        return cb(err);
                    if (existingUser)
                        return cb('User with email ' + existingUser.email + ' exists.');
                    else {
                        mongoose.model('User').create({ login: username, password: plainPassword, email: email, confirmed: false }, function (err, user) {
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
    } else {
        return cb({ error: "One field missing." })
    }
}

UserSchema.statics.getOnlines = function (strategy = undefined, cb) {
    mongoose.model('User').find({isOnline: true}, '-password -_id -__v', function (err, users) {
        if (err)
            return cb(err);

        // console.log('users retrieved : ', JSON.stringify(users));
        
        switch (strategy) {
            case 'lastSeen':
            users = users.sort((ua, ub) => (+ub.lastSeen||0 < +ua.lastSeen||0));
            break;
            default:
            users = users.sort((ua, ub) => (ub.login.charAt(0) < ua.login.charAt(0)));
            break;
        }
        // console.log('users sorted : ', JSON.stringify(users));
        cb(null, users);
    });
}

UserSchema.statics.getAll = function (strategy = undefined, cb) {
    mongoose.model('User').find({}, '-password -__v', function (err, users) {
        if (err)
            return cb(err);

        // console.log('users retrieved : ', JSON.stringify(users));
        
        switch (strategy) {
            case 'lastSeen':
            users = users.sort((ua, ub) => (+ub.lastSeen||0 < ua.lastSeen||0));
            break;
            default:
            users = users.sort((ua, ub) => (ub.login < ua.login));
            break;
        }
        // console.log('users sorted : ', JSON.stringify(users));
        cb(null, users);
    });
}

const UserModel = mongoose.model('User', UserSchema);
module.exports = { UserModel, UserSchema };