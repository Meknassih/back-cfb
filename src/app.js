const express = require('express');
const mustache = require('mustache');
const app = express();
const port = 3000;
const _templateDir = 'src/statics';
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport-jwt');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('morgan')('dev'));

//Configure Mongoose
mongoose.connect('mongodb://localhost/data');
mongoose.set('debug', true);

require('./models/User');

app.get('/', function (req, res) {

    let filePath = path.join(_templateDir, '/accueil.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            console.log('request ');
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
    let filePath = path.join(_templateDir, '/identification.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, (err, html) => {
        if (!err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(mustache.render(html, { connected: false }));
            res.end();
        } else {
            console.log(err);
        }
    });
});

app.post('/apirest/login', function (req, res) {
    mongoose.model('User').login(req.body.username, req.body.password, function (err, user) {
        if (err) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({error: 'Internal error'}));
        } else {
            if (user.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(user));
            } else {
                res.writeHead(300, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({error: 'Bad credentials'}));
            } 
        }
        res.end();
    });
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

app.post('/apirest/registration', function (req, res) {
    if (req.body.username &&
        req.body.password &&
        req.body.email) {

        var userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
        };

        mongoose.model('User').create(userData, function (err, user) {
            if (err) {
                res.json({"success": false,"details": err});
            } else {
                res.json({"success": true, "details": 'Inscription réussie.'});
            }
        });
    } else {
        res.json({"success": false, "details": "Une des valeurs est manquante."});
        res.end();
    }
});



app.get('/logout', function (req, res) {
    let filePath = path.join(_templateDir, '/accueil.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            console.log('request ');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        } else {
            console.log(err);
        }
    });

});

app.get('*', function (req, res) {
    res.redirect('/');
});


app.listen(port, () => console.info(`Back-end server listenning on ${port}`));