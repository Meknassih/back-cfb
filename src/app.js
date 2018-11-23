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
const jwt = require('jsonwebtoken');
const secretKey = 'toto';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('morgan')('dev'));
app.use(session({ secret: "rezjrezkjrezklrj4376786", resave: false, saveUninitialized: true }));
app.use(express.static(__dirname + '/statics'));

//Configure Mongoose
mongoose.connect('mongodb://localhost/data', { useNewUrlParser: true });
mongoose.set('debug', true);
const { UserModel } = require('./models/User');
const { DiscussionModel } = require('./models/Discussion');
const { MessageModel } = require('./models/Message');

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

app.get('/dashboard', function (req, res) {
    if (!req.session.user) {
        return res.status(401).send();
    }
    return res.status(200).send("WELCOME !!");
});

app.post('/restapi/discussions/get-or-create', function (req, res) {
    if (!req.body.token || !req.session.user || !req.session.token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0004',
            description: 'Session expirée ou inexistante'
        }));
        return res.end();
    }
    if (req.session.token === req.body.token) {
        // récupérer le label + creator depuis le body
        // console.log('session user ', req.session.user);
        const creatorId = req.session.user._id;
        const label = req.body.label;
        const members = req.body.members;
        let conditions;

        if (label) // Si le label est fourni
            conditions = { creator: creatorId, label: label };
        else // Sinon on se base sur la liste des membres
            conditions = { creator: creatorId, members: members };

        //TODO: implémenter _message.MessageModel.getLastMessages() et les ajouter à la discussion
        DiscussionModel.getOrCreateDiscussion(conditions, function (err, discussion, justCreated) {
            if (err) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0006',
                    description: 'Une erreur s\'est produite lors de la récupération de discussions',
                    payload: err
                }));
                return res.end();
            }

            if (discussion) {
                if (discussion.members.length > 9) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'error',
                        code: 'E0005',
                        description: 'Trop de membres tuent les membres',
                        payload: { totalMembers: discussion.members.length }
                    }));
                    return res.end();
                } else if (!justCreated) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'discussion',
                        code: 'T0006',
                        description: 'Récupération d\'une discussion existante',
                        payload: discussion
                    }));
                    return res.end();
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'discussion',
                        code: 'T0007',
                        description: 'Création d\'une discussion',
                        payload: discussion
                    }));
                    return res.end();
                }
            }
        })
    } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0006',
            description: 'Session expirée ou inexistante',
            payload: err
        }));
        return res.end();
    }
});

app.post('/restapi/discussions/list', function (req, res) {
    if (!req.body.token || !req.session.user || !req.session.token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0004',
            description: 'Session expirée ou inexistante'
        }));
        return res.end();
    }
    if (req.session.token === req.body.token) {
        // console.log('session user ', req.session.user);
        DiscussionModel.getUserInvolvedDiscussions(req.session.user._id, function (err, discussions) {
            if (err) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0011',
                    description: 'Une erreur s\'est produite lors de la récupération de discussions',
                    payload: err
                }));
                return res.end();
            }

            // console.log('returning discussions ', discussions);
            if (discussions) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'discussions',
                    code: 'T0011',
                    description: 'Liste de discussions auxquelles vous prenez part',
                    payload: discussions
                }));
                return res.end();
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'discussions',
                    code: 'T0011',
                    description: 'Liste de discussions auxquelles vous prenez part',
                    payload: []
                }));
                return res.end();
            }
        })
    } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0006',
            description: 'Session expirée ou inexistante',
            payload: err
        }));
        return res.end();
    }
});

app.post('/restapi/discussions/get-messages', function(req, res) {
    if (!req.body.token || !req.session.user || !req.session.token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0004',
            description: 'Session expirée ou inexistante'
        }));
        return res.end();
    } else if (!req.body.discussionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E1009',
            description: 'Identifiant de discussion manquant'
        }));
        return res.end();
    }

    MessageModel.getMessagesInDiscussion(req.body.discussionId, req.session.user._id, function(err, messages, discussion) {
        if (err) {
            if (err == 'notAllowed') {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0009',
                    description: 'Vous ne pouvez pas réaliser cette opération car vous n\'avez pas accès à cette conversation',
                }));
                return res.end();
            } else if (err == 'notFound') {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0009',
                    description: 'Vous ne pouvez pas réaliser cette opération car la discussion n\'existe pas',
                }));
                return res.end();
            } else {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'error',
                    code: 'E0009',
                    description: 'Une erreur s\'est produite lors de la récupération des messages',
                    payload: err
                }));
                return res.end();
            }
        }

        if (messages) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({
                    type: 'discussion',
                    code: 'T0013',
                    description: 'Récupération des messages de la discussion',
                    payload: {
                        id: discussion.id,
                        label: discussion.label,
                        lastMessages: messages
                    }
                }));
                return res.end();
        }
    }, req.body.options);  
});

app.post('/login', function (req, res) {
    let filePath = path.join(_templateDir, '/identification.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, html) {
        if (!err) {
            // console.log('request body', JSON.stringify(req.body));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(mustache.render(html, { 'connected': true }));
            res.end();
        } else {
            // console.log(err);
        }
    });
});

app.post('/restapi/login', function (req, res) {
    if (!req.body.login || !req.body.password) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0002',
            description: 'Veuillez renseigner un nom d\'utilisateur et un mot de passe'
        }));
        return res.end();
    }
    mongoose.model('User').login(req.body.login, req.body.password, function (err, user) {
        if (err) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'error',
                code: 'E0002',
                description: 'Session expirée ou inexistante',
                payload: err
            }));
            return res.end();
        } else {
            // console.log('found user ', JSON.stringify(user))
            if (user) {
                user.setOnline(function (err) {
                    if (err) {
                        res.writeHead(503, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify({
                            type: 'error',
                            code: 'E0002',
                            description: 'Session expirée ou inexistante',
                            payload: err
                        }));
                        return res.end();
                    } else {
                        req.session.user = user;
                        req.session.token = encrypt(user.login + new Date().valueOf() + user.email)
                        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                        res.write(JSON.stringify({
                            type: 'authentication',
                            code: 'T0001',
                            description: 'Vous êtes maintenant connecté',
                            payload: { token: req.session.token }
                        }));
                    }
                    return res.end();
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

app.post('/restapi/register', function (req, res) {
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

app.post('/restapi/confirmation-mail', function (req, res) {
    // console.log('encrypted ', req.body.email, '=', encrypt(req.body.email));
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
                                pour terminer votre inscription veuillez cliquer sur le lien suivant : <b><a href="http://${ip}/email/confirm/${encrypt(user.email)} ">confirmer mon adresse</a></b>.<br><br>
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
    // console.log('words ', urlWords);
    const userEmail = decrypt(urlWords.pop());
    // console.log('userEmail :', userEmail);
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

app.get('/restapi/logout', function (req, res) {
    res.writeHead(503, { 'Content-Type': 'application/json' });

    if (req.session.user) {
        req.session.destroy();
        res.write(JSON.stringify({
            type: 'authentication',
            code: 'T0003',
            description: 'Vous avez bien été déconnecté'
        }));
    } else {
        res.write(JSON.stringify({
            type: 'authentication',
            code: 'E0003',
            description: 'Session expirée ou inexistante'
        }));
    }
    res.end();
});

app.post('/restapi/client-heart-beat', function (req, res) {
    // console.log('Client token rcv ', req.body.token, ' stored token ', req.session.token);
    if ((!req.body.token && !req.body.payload) || !req.session.user || !req.session.token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0003',
            description: 'Bail non renouvelable'
        }));
        return res.end();
    } else {
        const clientToken = req.body.token ? req.body.token : req.body.payload.token;
        if (clientToken === req.session.token) {
            const user = new UserModel(req.session.user);
            // console.log('session user ', JSON.stringify(user));
            user.setOnline(function (err) {
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'error',
                        code: 'E0003',
                        description: 'Bail non renouvelable',
                        payload: err
                    }));
                    return res.end();
                } else {
                    req.session.user = user;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'authentication',
                        code: 'T0002',
                        description: 'Votre bail a été renouvelé'
                    }));
                    return res.end();
                }
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'error',
                code: 'E0003',
                description: 'Bail non renouvelable'
            }));
            res.end();
        }
    }
});

app.post('/restapi/members/get-all', function (req, res) {
    if (!req.body.token || !req.session.user || !req.session.token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0004',
            description: 'Session expirée ou inexistante'
        }));
        return res.end();
    } else {
        if (req.body.token === req.session.token) {
            mongoose.model('User').getAll(req.body.strategy, function (err, users) {
                //console.log('getAll user ', JSON.stringify(users));
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'error',
                        code: 'E0004',
                        description: 'Une erreur interne s\'est produite',
                        payload: err
                    }));
                    return res.end();
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'members',
                        code: 'T0004',
                        description: 'Liste des utilisateurs inscrits',
                        payload: users
                    }));
                    return res.end();
                }
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'error',
                code: 'E0004',
                description: 'Session expirée ou inexistante'
            }));
            res.end();
        }
    }
});

app.post('/restapi/discussions/leave', function (req, res) {
    if (!req.body.token || !req.session.user || !req.session.token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0004',
            description: 'Session expirée ou inexistante'
        }));
        return res.end();
    } else if (!req.body.discussionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({
            type: 'error',
            code: 'E0008',
            description: 'Identifiant de la discussion manquant'
        }));
        return res.end();
    } else {
        if (req.body.token === req.session.token) {
            DiscussionModel.findById(mongoose.Types.ObjectId(req.body.discussionId), function (err, discussion) {
                //console.log('getAll user ', JSON.stringify(users));
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'error',
                        code: 'E0008',
                        description: 'Une erreur interne s\'est produite',
                        payload: err
                    }));
                    return res.end();
                }
                if (discussion) {
                    // console.log('>>session id ', req.session.user._id, ' >> members ', discussion.members)
                    const index = discussion.members.findIndex((m) => (m == req.session.user._id));
                    // console.log('index ', index);
                    if (index > -1) { // Membre normal quitte la conversation
                        discussion.members.splice(index, 1);
                        discussion.save(function (err, updatedDisc) {
                            if (err) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.write(JSON.stringify({
                                    type: 'error',
                                    code: 'E0008',
                                    description: 'Une erreur interne s\'est produite',
                                    payload: err
                                }));
                                return res.end();
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify({
                                type: 'discussion',
                                code: 'T0010',
                                description: 'Vous avez quitté la conversation',
                                payload: updatedDisc
                            }));
                            return res.end();
                        });
                    } else if (req.session.user._id === discussion.creator.toString()) {
                        // Membre créateur quitte la conversation
                        if (!req.body.force) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify({
                                type: 'error',
                                code: 'E0007',
                                description: 'Pour quitter une conversation dont vous êtes créateur, il faut forcer sa suppresion',
                                payload: discussion
                            }));
                            return res.end();
                        }
                        // TODO:
                        DiscussionModel.deleteById(discussion.id, function (err) {
                            if (err) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.write(JSON.stringify({
                                    type: 'error',
                                    code: 'E0008',
                                    description: 'Une erreur interne s\'est produite',
                                    payload: err
                                }));
                                return res.end();
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify({
                                type: 'discussion',
                                code: 'T0009',
                                description: 'La discussion a été supprimée, ainsi que son historique'
                            }));
                            return res.end();
                        });

                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify({
                            type: 'error',
                            code: 'E0008',
                            description: 'Vous ne pouvez pas quitter cette conversation car vous n\'en faites pas partie'
                        }));
                        return res.end();
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({
                        type: 'error',
                        code: 'E0008',
                        description: 'Conversation inexistante'
                    }));
                    return res.end();
                }
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                type: 'error',
                code: 'E0004',
                description: 'Session expirée ou inexistante'
            }));
            res.end();
        }
    }
});

app.listen(port, () => console.info(`Back-end server listenning on port ${port}`));