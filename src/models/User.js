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


UserSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        username: this.username,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
};


UserSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        username: this.username,
        email: this.email,
        avatarUrl: this.avatarUrl,
        lastSeen: this.lastSeen,
        token: this.generateJWT(),
    };
};

UserSchema.statics.login = function(username, plainPassword, cb) {
    return this.find({username: username, password: plainPassword}, cb);
}

mongoose.model('User', UserSchema);