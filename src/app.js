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
        mongoose.model('User').register(req.body.login, req.body.password, req.body.email, function(err, registeredUser) {
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