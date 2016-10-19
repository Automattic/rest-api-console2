var express = require('express'),
    browserify = require('browserify-middleware'),
    sassMiddleware = require('node-sass-middleware'),
    app = express(),
    port = process.env.PORT || 4000,
    package = require('./package.json'),
    config = {};

try {
  config = require('./config.json');
} catch (e) {
  console.warn("Application configuration not present: config.json");
}

console.log("Using config: ", JSON.stringify(config));

// use jade template engine
app.engine('jade', require('jade').__express);

app.set('view engine', 'jade');
app.set('views', process.cwd() + '/templates/views');

// build app.js using browserify
app.get('/app.js', browserify('./lib/app.js'));
app.get('/search.js', browserify('./lib/search.js'));

// compile sass files
app.use(sassMiddleware({
  src:process.cwd() + '/templates/sass',
  debug:true,
  response:true
}));

// serve app html
app.get('/', function(req, res) {
  config.build = 'dev';
  config.resource_version = 'dev-' + (new Date()).getTime();
  config.version = package.version;
  res.render('app', config);
});


// serve static assets
app.use(express.static(__dirname + '/public'));

app.listen(port);

console.log("Running console on port %d", port);
