var Component = require('./component'),
    querystring = require('querystring'),
    transparent = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

var AuthPanel = Component.extend({
  'loadingClass' : 'loading',
  'authorizedClass' : 'authorized',
  'activeClass' : 'active',
  'labelClass' : 'label',
  'imgClass'   : 'img',
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
    this.node.on('keydown', this.detectActive.bind(this));
    this.node.on('keypress', this.onKeypress.bind(this));
    this.label = $('<span></span>').appendTo(this.node).addClass(this.options.labelClass);
    this.extra = $('<span></span>').appendTo(this.node).addClass(this.options.extraClass).text('Sign In');
    this.img = $('<span></span>').appendTo(this.node).addClass(this.options.imgClass);
    this.avatar = $('<img>').appendTo(this.img).attr('src', transparent).hide();

    this.throbber = $('<div><div></div></div>').addClass('throbber').appendTo(this.node);
  }
});

AuthPanel.prototype.checkForToken = function() {

  var authParams;
  try {

    // load from hash if present
    var url = window.location.toString(),
        index = url.indexOf('#access_token');

    if (index > -1) {
      var hash = url.slice(index + 1);

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
    this.options.onCheckToken(this, this.onCheck.bind(this));
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
    this.setValue(null);
  } else {
    this.extra.text(this.options.signOutText);
    this.node.addClass(this.options.authorizedClass);
    var avatar = this.avatar.show();
    var img = new Image();
    $(img).on('load', function() {
      avatar.attr('src', response.avatar_URL).css('opacity','1');
    }).attr('src', response ? response.avatar_URL : '');

  }

};

AuthPanel.prototype.getRedirectUri = function() {
  return $('meta[name=redirect_uri]').attr('content');
};

AuthPanel.prototype.getClientId = function() {
  return $('meta[name=client_id]').attr('content');
};

AuthPanel.prototype.getAuthorizeHeaders = function() {

  if (!this.getValue()) {
    return {};
  }

  return { 'Authorization' : 'BEARER ' + this.getValue().access_token };

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
};

AuthPanel.prototype.detectActive = function(e) {

  var node = this.node,
      cls = this.options.activeClass;

  if (e.which == 13 || e.which == 32) {

    node.addClass(cls);
    setTimeout(function() {
      node.removeClass(cls);
    }, 200);

  }

};

module.exports = AuthPanel;
