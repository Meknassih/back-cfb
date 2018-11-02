const express = require('express');
const mustache = require('mustache');
const app = express();
const port = 3000;
const _templateDir = 'src/statics';
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport-jwt');
const nodemailer = require('nodemailer');
const hash = require('object-hash');
const publicIp = require('public-ip');
const crypto = require('crypto');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('morgan')('dev'));
app.use(session({secret:"rezjrezkjrezklrj4376786", resave: false, saveUninitialized:true}));
app.use(express.static(__dirname + '/statics'));

//Configure Mongoose
mongoose.connect('mongodb://localhost/data');
mongoose.set('debug', true);

require('./models/User');

app.get('/', function (req, res) {

    let filePath = path.join(_templateDir, 'index.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        } else {
            console.log(err);
        }
    });
});

// Setting up cryptography
const algorithm = 'aes-256-ctr';
const password = 'mp45L)dv:T';
function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

app.get('/about', function (req, res) {
    let filePath = path.join(_templateDir, '/propos.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, html) {
        if (!err) {
            console.info('GET /about : ', JSON.stringify(req.body));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(html);
            res.end();
        } else {
            console.log(err);
        }
    });
});

app.get('/word', function (req, res) {
    res.send('Word page')
});

app.get('/login', function (req, res) {
    console.info('GET /login : ', JSON.stringify(req.body));
    let filePath = path.join(_templateDir, 'login.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, (err, html) => {
        if (!err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(html);
            res.end();
        } else {
            console.log(err);
        }
    });
});

app.post('/apirest/login', function (req, res) {
    mongoose.model('User').login(req.body.login, req.body.password, function (err, user) {
        if (err) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'error',
                code: 'E0002',
                description: 'Session expirée ou inexistante'
            }));
            console.log('ending')
            res.end();
        } else {
            //console.log(JSON.stringify(user));
            if (user) {
                mongoose.model('User').setConnected(user, function (err, user) {
                    if (err) {
                        res.writeHead(503, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify({
                            type: 'error',
                            code: 'E0002',
                            description: 'Session expirée ou inexistante'
                        }));
                    } else {
                        req.session.user = user;
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify({
                            type: 'authentication',
                            code: 'T0001',
                            description: 'Vous êtes maintenant connecté',
                            payload: user
                        }));
                    }
                    res.end();
                });
            } else {
                res.writeHead(300, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0001',
                    description: 'Mauvais login ou mot de passe'
                }));
                res.end();
            }
        }
    });
});

app.get('/dashboard', function (req, res) {
    if(!req.session.user){
        return res.status(401).send();
    }
    return res.status(200).send("WELCOME !!");
});


app.post('/login', function (req, res) {
    let filePath = path.join(_templateDir, '/identification.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, html) {
        if (!err) {
            console.log('request body', JSON.stringify(req.body));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(mustache.render(html, { 'connected': true }));
            res.end();
        } else {
            console.log(err);
        }
    });
});

app.post('/apirest/register', function (req, res) {
    if (req.body.login &&
        req.body.password &&
        req.body.email) {
        mongoose.model('User').register(req.body.login, req.body.password, req.body.email, function (err, registeredUser) {
            if (err) {
                res.writeHead(300, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E1001',
                    description: err
                }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'registration',
                    code: 'T1001',
                    description: 'Vous êtes maintenant inscrit.',
                    payload: registeredUser
                }));
            }
            res.end();
        });
    } else {
        res.writeHead(300, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E1002',
            description: 'Une des valeurs est manquante.'
        }));
        res.end();
    }
});

app.post('/apirest/confirmation-mail', function (req, res) {
    console.log('encrypted ', req.body.email, '=', encrypt(req.body.email));
    if (req.body.login && req.body.email) {
        mongoose.model('User').findOne({ login: req.body.login, email: req.body.email }, function (err, user) {
            if (err) {
                res.writeHead(300, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E1005',
                    payload: err
                }));
                res.end();
            } else if (user) {
                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: 'cfb.back3@gmail.com', // generated ethereal user
                        pass: 'Ynov2018' // generated ethereal password
                    }
                });

                publicIp.v4().then(ip => {
                    let mailOptions = {
                        from: '"5G mailer (noreply)" <cfb.back3@gmail.com>', // sender address
                        to: 'elmeknassi.h@gmail.com', // list of receivers
                        subject: 'Finalisez la création de votre compte ✔', // Subject line
                        html: `<p>Bonjour,<br><br>
                                pour terminer votre inscription veuillez cliquer sur le lien suivant : <b><a href="http://${ip}/email/confirm/${hash({ login: user.login, email: user.email })} ">confirmer mon adresse</a></b>.<br><br>
                                A très bientôt sur 5G.<br><br>
                                Merci de ne pas répondre à cet email.</p>
                                `
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            res.writeHead(300, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify({
                                type: 'error',
                                code: 'E1004',
                                description: err
                            }));
                            res.end();
                            return console.log(error);
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify({
                                type: 'email',
                                code: 'T1002',
                                description: 'Email de confirmation envoyé.',
                                payload: info
                            }));
                            res.end();
                            console.log('Message sent: %s', info.messageId);
                        }
                    });
                });

            } else {
                res.writeHead(300, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E1006',
                    description: 'Aucun utilisateur avec ces informations.',
                    payload: req.body
                }));
                res.end();
            }
        });

    }
});

app.get('/email/confirm/*', function (req, res) {
    let urlWords = req.url.split('/');
    console.log('words ', urlWords);
    const userEmail = decrypt(urlWords.pop());
    mongoose.model('User').findOne({ email: userEmail, confirmed: false }, function (err, user) {
        if (err) {
            res.writeHead(300, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'error',
                code: 'E1007',
                payload: err
            }));
            res.end();
            return;
        } else {
            if (user) {
                user.setEmailConfirmed(function (err, email) {
                    if (err) {
                        res.writeHead(300, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify({
                            type: 'error',
                            code: 'E1008',
                            payload: err
                        }));
                        res.end();
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(`<html><head><title>5G - Confirmation</title></head>
                        <body>
                        <h1>5G</h1><h2>Votre adresse e-mail a été confirmée</h2></br></br>
                        <p> 
                        Merci d'avoir confirmé votre adresse e-mail : ${email}. Vous pouvez désormais fermer cette fenêtre.
                        </p>
                        </body></html>`);
                        res.end();
                    }
                });
            } else {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.write(`<html><head><title>5G - Error</title></head>
                <body>
                <h1>Error 400 - Bad request</h1></html>`);
                res.end();
            }
        }
    });
});

app.get('/logout', function (req, res) {
    res.writeHead(503, { 'Content-Type': 'application/json' });

    if(req.session.user){
        req.session.destroy();
        res.write(JSON.stringify({
            type: 'authentication',
            code: 'T0003',
            description: 'Vous avez bien été déconnecté'
        }));
    } else {
        res.write(JSON.stringify({
            type: 'authentication',
            code: 'E0002',
            description: 'Session expirée ou inexistante'
        }));
    }
    res.end();


});

app.listen(port, () => console.info(`Back-end server listenning on ${port}`));