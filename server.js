var express = require('express'),
    morgan = require('morgan'),
    browserify = require('browserify-middleware'),
    sass = require('node-sass'),
    app = express(),
    port = process.env.PORT || 4000;

// use jade template engine
app.engine('html', require('jade').__express);


app.set('views', process.cwd() + '/templates/views');

// logger
app.use(morgan());

// build app.js using browserify
app.get('/app.js', browserify('./lib/ui/index.js'));

// 
app.use(sass.middleware({
  src:process.cwd() + '/templates/sass',
  debug:true,
  response:true
}));

// serve app html
app.get('/', function(req, res) {
  res.render('index.html', {'build':'dev'});
});


// serve static assets
app.use(express.static(__dirname + '/public'));

app.listen(port);

console.log("Running on part %d", port);