const express = require('express');
const mustache = require('mustache');
const app = express();
const port = 3000;


app.get('/', (req, res) => res.send('Hello World!'));

app.get('/about', function(req, res){
    res.send('About page !')
});

app.get('/word', function(req, res){
    res.send('Word page')
});

app.get('/login', function(req, res){
    res.send('Login page')
});

app.get('/logout', function(req, res){
    res.send('Logout page')

});

app.get('*', function (req,res) {
    res.redirect('/');
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));