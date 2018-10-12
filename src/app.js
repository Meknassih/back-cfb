const express = require('express');
const mustache = require('mustache');
const app = express();
const port = 3000;
const _templateDir = 'src/statics';
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    
    let filePath = path.join(_templateDir, '/accueil.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            console.log('request ', );
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

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            console.log('request ', );
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        } else {
            console.log(err);
        }
    });
});

app.get('/word', function (req, res) {
    res.send('Word page')
});

app.post('/login', function (req, res) {
    let filePath = path.join(_templateDir, '/identification.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, html) {
        if (!err) {
            console.log('request body', JSON.stringify(req.body));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(mustache.render(html, {'connected':true}));
            res.end();
        } else {
            console.log(err);
        }
    });
});

app.get('/logout', function (req, res) {
    let filePath = path.join(_templateDir, '/accueil.html');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            console.log('request ', );
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


app.listen(port, () => console.log(`Example app listening on port ${port}!`));