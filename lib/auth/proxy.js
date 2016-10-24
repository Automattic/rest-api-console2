var proxy = require('wpcom-proxy-request'),
    $ = require('zepto-browserify').$,
    timer;

function init() {
  proxy({ metaAPI: { accessAllUsersBlogs: true }}, function(err, response) {
    if (err !== null) throw err;
  }); 
}

function buildProxy(authPanel) {
  var proxy = new Proxy(authPanel);

  authPanel.checkAuthentication();

  return proxy;
}

function Proxy(authPanel) {
  // first initialize the proxy
  var proxy = this;

  // if checking for a token
  authPanel.on('check', function(callback) {
    if (proxy.timer) clearTimeout(proxy.timer);

    proxy.timer = setTimeout(function() {
      authPanel.abortAuth();
    }, 3000);

    proxy.request( { path: '/me' }, function(err, response) {
      clearTimeout(proxy.timer);
      callback(err, response);
    });

  });

  authPanel.on('signin', function(panel) {
    window.location = "https://wordpress.com/wp-login.php?" + panel.$.param({
      'redirect_to' : window.location.href
    });
  });

  authPanel.on('signout', function(panel) {
    window.location = "https://wordpress.com/wp-login.php?" + panel.$.param({
      'action' : 'logout',
      'redirect_to' : window.location.href
    });
  });

}

Proxy.prototype.request = function(request, callback) {
  proxy(request, callback);
};

module.exports = function(config) {
  $(function() {
    init();
  });
  return buildProxy;
};

