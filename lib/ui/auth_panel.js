var Component = require('./component'),
    querystring = require('querystring');

var AuthPanel = Component.extend({
  'loadingClass' : 'loading',
  'authorizedClass' : 'authorized',
  'labelClass' : 'label',
  'extraClass' : 'extra',
  'signInText' : 'Sign In',
  'signOutText' : 'Sign Out',
  'onChange' : function(value) {
    this.checkAuthentication();
  },
  'onCheckToken' : function(){ console.warn("No auth token check"); },
  'init': function () {
    var self = this;

    this.node.on('click', this.onClick.bind(this));
    this.node.on('keypress', this.onKeypress.bind(this));
    this.label = $('<span></span>').appendTo(this.node).addClass(this.options.labelClass);
    this.extra = $('<span></span>').appendTo(this.node).addClass(this.options.extraClass).text('Sign In');
    this.avatar = $('<img>').appendTo(this.node).hide();

    this.throbber = $('<div><div></div></div>').addClass('throbber').appendTo(this.node);
  },
  'afterInit' : function() {
    this.checkForToken();
  }
});

AuthPanel.prototype.checkForToken = function() {

  var authParams;
  try {

    // load from hash if present
    if (window.location.hash.indexOf('#') === 0) {
      var hash = window.location.hash.slice(1);

      window.history.replaceState({}, null, window.location.pathname);

      authParams = querystring.parse(hash);

      localStorage.auth = hash;
    }

    // load from localStroage if present
    if (!authParams && localStorage.auth) {
      authParams = querystring.parse(localStorage.auth);
    }

  } catch (error) {
    // no auth params
    delete localStorage.auth;
  }

  this.setValue(authParams);

};

AuthPanel.prototype.checkAuthentication = function() {

  if (this.getValue()) {
    this.node.addClass(this.options.loadingClass);
    this.options.onCheckToken(this.getValue(), this.onCheck.bind(this));
  } else {
    delete localStorage.auth;
    this.node.removeClass(this.options.authorizedClass);
    this.avatar.hide();
    this.extra.text(this.options.signInText);
  }

};

AuthPanel.prototype.onCheck = function(err, response) {

  this.node.removeClass(this.options.loadingClass);

  if (err) {
    delete localStorage.auth;
    this.node.removeClass(this.options.authorizedClass);
    this.extra.text(this.options.signInText);
  } else {
    this.extra.text(this.options.signOutText);
    this.node.addClass(this.options.authorizedClass);
    this.avatar.attr('src', response.avatar_URL).show();

  }

};

AuthPanel.prototype.getRedirectUri = function() {
  return $('meta[name=redirect_uri]').attr('content');
};

AuthPanel.prototype.getClientId = function() {
  return $('meta[name=client_id]').attr('content');
};

AuthPanel.prototype.getAuthenticationUri = function() {
  return "https://public-api.wordpress.com/oauth2/authorize?" + $.param({
    'redirect_uri' : this.getRedirectUri(),
    'client_id'    : this.getClientId(),
    'response_type': 'token'
  });
};

AuthPanel.prototype.redirect = function() {
  window.location = this.getAuthenticationUri();
};

AuthPanel.prototype.performAuthAction = function() {
  if (this.node.hasClass(this.options.loadingClass)) {
    return;
  }

  if (this.node.hasClass(this.options.authorizedClass)) {
    this.setValue(null);
    return;
  }

  this.redirect();
};

AuthPanel.prototype.onClick = function() {
  this.performAuthAction();
};

AuthPanel.prototype.onKeypress = function(e) {
  if (e.which == 13 || e.which == 32) {
    this.performAuthAction();
  }
}

module.exports = AuthPanel;
