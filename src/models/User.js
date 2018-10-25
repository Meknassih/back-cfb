const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UserSchema = new Schema({
    username: String,
    password: String,
    email: String,
    salt: String,
    avatarUrl: String,
    isOnline: Boolean,
    lastSeen: Date
}, {
        timestamps: true,
    });


UserSchema.methods.generateJWT = function () {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        username: this.username,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
};


UserSchema.methods.toAuthJSON = function () {
    return {
        _id: this._id,
        username: this.username,
        email: this.email,
        avatarUrl: this.avatarUrl,
        lastSeen: this.lastSeen,
        token: this.generateJWT(),
    };
};

UserSchema.statics.login = function (username, plainPassword, cb) {
    return this.findOne({ username: username, password: plainPassword }, cb);
}

UserSchema.statics.setConnected = function (user, cb) {
    return this.findOne({ username: user.username }, function (err, user) {
        if (err)
            return cb(err);
        user.isOnline = true;
        user.lastSeen = new Date();
        user.save(function (err, savedUser) {
            if (err)
                return cb(err);
            cb(null, savedUser);
        });
    });
}

UserSchema.statics.register = function (username, plainPassword, email, cb) {
    if (username && plainPassword && email) {
        return this.findOne({ username: username }, (err, existingUser) => {
            if (err)
                return cb(err);
            if (existingUser)
                return cb('User with username ' + existingUser.username + ' exists.');
            else {
                this.findOne({ email: email }, (err, existingUser) => {
                    if (err)
                        return cb(err);
                    if (existingUser)
                        return cb('User with email ' + existingUser.email + ' exists.');
                    else {
                        mongoose.model('User').create({username: username, password: plainPassword, email: email}, function (err, user) {
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

mongoose.model('User', UserSchema);