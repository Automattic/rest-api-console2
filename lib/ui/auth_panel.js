var Component = require('./component'),
    $ = Component.$,
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
    if (!value) {
      this.extra.text(this.options.signInText);
      this.node.removeClass(this.options.authorizedClass);
      this.avatar.attr('src', transparent).hide();
    } else {
      this.extra.text(this.options.signOutText);
      this.node.addClass(this.options.authorizedClass);
      var avatar = this.avatar.show();
      var img = new Image();
      $(img).on('load', function() {
        avatar.attr('src', value.avatar_URL).css('opacity','1');
      }).attr('src', value ? value.avatar_URL : '');
    }
  },
  'onCheckToken' : function(){ console.warn("No auth token check"); },
  'init': function () {
    var self = this;

    this.node.on('click', this.onClick.bind(this));
    this.node.on('keydown', this.detectActive.bind(this));
    this.node.on('keypress', this.onKeypress.bind(this));
    this.label = $('<span></span>').appendTo(this.node).addClass(this.options.labelClass);
    this.extra = $('<span></span>').appendTo(this.node).addClass(this.options.extraClass).text(this.options.signInText);
    this.img = $('<span></span>').appendTo(this.node).addClass(this.options.imgClass);
    this.avatar = $('<img>').appendTo(this.img).hide();

    this.throbber = $('<div><div></div></div>').addClass('throbber').appendTo(this.node);
  }
});

AuthPanel.prototype.checkAuthentication = function() {
  this.node.addClass(this.options.loadingClass);
  this.emit('check', this.onCheck.bind(this));
};

AuthPanel.prototype.abortAuth = function() {
  this.node.removeClass(this.options.loadingClass);
  this.setValue(null);
};

AuthPanel.prototype.onCheck = function(err, response) {

  this.node.removeClass(this.options.loadingClass);

  if (err) {
    this.setValue(null);
  } else {
    this.setValue(response);
  }

};

AuthPanel.prototype.getRedirectUri = function() {
  return $('meta[name=redirect_uri]').attr('content');
};

AuthPanel.prototype.performAuthAction = function() {
  if (this.node.hasClass(this.options.loadingClass)) {
    return;
  }

  if (this.getValue()) {
    this.emit('signout', this);
    return;
  }

  this.emit('signin', this);
};

AuthPanel.prototype.authenticate = AuthPanel.prototype.performAuthAction;

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
