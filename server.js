var express = require('express'),
    morgan = require('morgan'),
    browserify = require('browserify-middleware'),
    app = express(),
    port = process.env.PORT || 4000;

app.engine('html', require('jade').__express);

app.use(morgan());

app.get('/app.js', browserify('./lib/ui/index.js'));

app.get('/', function(req, res) {
  res.render('index.html');
});

app.use(express.static(__dirname + '/public'));

app.listen(port);

console.log("Running on part %d", port);