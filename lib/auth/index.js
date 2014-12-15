module.exports = function(config) {
  // support using different auth schemes. oauth by default and
  // the wpcom proxy module if specified

  switch(config.auth) {
  // use the wpcom-proxy module
  case 'proxy':
    return require('./proxy')(config);
  // by default use the oauth module which requires a redirect
  // URI and app ID
  default :
    return require('./oauth')(config);
  }

};