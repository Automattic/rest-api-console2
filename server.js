var express = require('express'),
    app = express(),
    port = process.env.PORT || 4000;

app.use(express.static(__dirname + '/public'));

app.listen(port);

console.log("Running on part %d", port);