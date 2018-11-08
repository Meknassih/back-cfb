
jwt.sign(JSON.stringify({
    type: 'error',
    code: 'E0002',
    description: 'Veuillez renseigner un nom d\'utilisateur et un mot de passe'
}), 'toto', (err,data) => {
    res.send(data);
});

var decoded = jwt.verify('eyJhbGciOiJIUzI1NiJ9.eyJ0eXBlIjoiZXJyb3IiLCJjb2RlIjoiRTAwMDIiLCJkZXNjcmlwdGlvbiI6IlZldWlsbGV6IHJlbnNlaWduZXIgdW4gbm9tIGQndXRpbGlzYXRldXIgZXQgdW4gbW90IGRlIHBhc3NlIn0.NStuX2mNpIhh41XpMd4MswC_71kQcAIibuUlxiTkaE8', 'toto');
res.send(decoded);