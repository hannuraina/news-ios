var module = angular.module('pi-news.controllers', []);

var AppController = function($rootScope, $log, $state, $ionicSideMenuDelegate, $cordovaNetwork, AdService, ConfigService, UserService, TrackService, ArticleService) {
  var _this                   = this;
  this.version                = '1.1.0';
  this.$rootScope             = $rootScope;
  this.$log                   = $log;
  this.$state                 = $state;
  this.$document              = document;
  this.$ionicSideMenuDelegate = $ionicSideMenuDelegate;
  this.Config                 = ConfigService;
  this.Ads                    = AdService;
  this.User                   = UserService;
  this.Track                  = TrackService;
  this.Articles               = ArticleService;
  this.canShare               = false;
  this.refreshing             = false;
  this.online                 = typeof navigator.connection === 'undefined' ?
                                true :
                                $cordovaNetwork.isOnline();

  // load default state on app load
  this.$state.go('main.tabs.latest');
  this.$log.debug('app controller loaded!');

  // track current user
  if (this.User.user && this.User.user.userId) this.Track.user(this.User.user.userId);

  // bind global events
  this.$rootScope.$on('$stateChangeStart',  this.stateChangeStart.bind(this));
  this.$rootScope.$on('$stateChangeSuccess', this.stateChangeSuccess.bind(this));
  this.$document.addEventListener('online', this.toggleOnline.bind(this), false);
  this.$document.addEventListener('offline', this.toggleOffline.bind(this), false);
};
AppController.prototype.toggleOnline = function() {
  var _this   = this,
      promise = _this.Articles.fetchLatest();

  _this.refreshing = true;
  _this.online = true;

  promise.then(function() {
    _this.$state.go('main.tabs.latest', null, { reload: true });
  });

  return promise;
};
AppController.prototype.toggleOffline = function() {
  var _this = this;

  _this.online = false;
  _this.$state.go('main.tabs.latest', null, { reload: true });
};
AppController.prototype.toggleLeft = function() {
  var _this = this;
  _this.$ionicSideMenuDelegate.toggleLeft();
};
AppController.prototype.toggleFont = function() {
  var _this     = this,
      fontSize  = parseInt(_this.Config.config.style['font-size'], 10);

  _this.Config.config.style = {
    'font-size': (fontSize >= 150) ? '100%' : (fontSize + 10) + '%'
  };
  _this.Config.saveConfig(_this.Config.config);
};
AppController.prototype.stateChangeStart = function(event, toState, toParams, fromState, fromParams) {
};
AppController.prototype.stateChangeSuccess = function(event, toState, toParams, fromState, fromParams) {
};
AppController.$inject = ['$rootScope', '$log', '$state', '$ionicSideMenuDelegate', '$cordovaNetwork', 'AdService', 'ConfigService', 'UserService', 'TrackService', 'ArticleService'];
module.controller('AppController', AppController);


var ArticleController = function($scope, $log, $state, $filter, $timeout, $ionicSideMenuDelegate, ArticleService, TrackService) {
  var _this                   = this;
  this.$scope                 = $scope;
  this.$log                   = $log;
  this.$state                 = $state;
  this.$filter                = $filter;
  this.$timeout               = $timeout;
  this.$ionicSideMenuDelegate = $ionicSideMenuDelegate;
  this.Articles               = ArticleService;
  this.Track                  = TrackService;
  this.$log.debug('article controller loaded!');
};
ArticleController.prototype.toggleSave = function(article) {
  var _this   = this,
      isSaved = _this.isSaved(article);

  if (!isSaved) {
    _this.Articles.saveArticle(article);
  } else {
    _this.Articles.removeArticle(article);
  }
};
ArticleController.prototype.isSaved = function(article) {
  var _this = this;
  if (!_this.Articles.saved) return false;
  return _this.$filter('filter')(_this.Articles.saved, { saxotech_id: article.saxotech_id }).length > 0;
};
ArticleController.prototype.refresh = function() {
  var _this   = this,
      promise = _this.Articles.fetchLatest();

  // hide ionic refresher and substitute custom loader
  _this.$scope.$broadcast('scroll.refreshComplete');
  _this.refreshing = true;

  promise.then(function() {
    _this.$timeout(function() {
      _this.refreshing = false;
    }, 1000);
  });

  return promise;
};
ArticleController.prototype.share = function() {
  var _this  = this,
      title  = _this.Articles.current.title,
      link   = _this.Articles.current.link;

  if (angular.isDefined(window.plugins)) {
    window.plugins.socialsharing.share(title, null, null, link);
  }
};
ArticleController.prototype.adClick = function($event, ad) {
  var _this     = this;

  if (ad.email && angular.isDefined(window.plugins)) {
    window.plugins.socialsharing.shareViaEmail(ad.subject,
      ad.subject,
      [ad.email.replace('mailto:', '')]
    );
  } else if (ad.link) {
    window.open(ad.link, '_blank', 'location=yes', 'closebuttoncaption=back');
  }
};
ArticleController.prototype.emailClick = function($event, item) {
  var _this = this;

  $event.preventDefault();

  if (item.authorEmail && angular.isDefined(window.plugins)) {
    window.plugins.socialsharing.shareViaEmail(item.title,
      'P&I News App Story',
      [item.authorEmail]
    );
  }
};
ArticleController.$inject = ['$scope', '$log', '$state', '$filter', '$timeout', '$ionicSideMenuDelegate', 'ArticleService', 'TrackService'];
module.controller('ArticleController', ArticleController);



var SearchController = function($scope, $log, $state, $filter, SearchService, TrackService) {
  var _this    = this;
  this.$scope  = $scope;
  this.$log    = $log;
  this.$state  = $state;
  this.$filter = $filter;
  this.Search  = SearchService;
  this.Track   = TrackService;
  this.$log.debug('search controller loaded!');
};
SearchController.prototype.searchOffline = function(query) {
  var _this = this;
  _this.Search.fetchOfflineSearch(query);
};
SearchController.prototype.searchOnline = function(query) {
  var _this   = this,
      promise = _this.Search.fetchOnlineSearch(query);

  _this.searching = true;
  promise.then(function() {
    _this.searching = false;
  });
  return promise;
};
SearchController.prototype.searchVisit = function(item) {
  var _this = this,
      url   = item.bypass_link;
  window.open(url, '_blank', 'location=yes', 'closebuttoncaption=back');
};
SearchController.prototype.loadCarousel = function(index) {
  var _this = this;
  _this.$state.go('.carousel', { index: index });
};
SearchController.$inject = ['$scope', '$log', '$state', '$filter', 'SearchService', 'TrackService'];
module.controller('SearchController', SearchController);


var ListController = function($scope, $log, $state, ModalService, UserService, ArticleService, TrackService, items, title) {
  var _this     = this;
  this.$scope   = $scope;
  this.$log     = $log;
  this.$state   = $state;
  this.Modal    = ModalService;
  this.User     = UserService;
  this.Track    = TrackService;
  this.Articles = ArticleService;
  this.items    = items;
  this.title    = title;

  this.Track.page([title, 'List'].join(' '));
  this.$log.debug('list controller loaded!');
};
ListController.prototype.loadCarousel = function(index) {
  var _this = this;

  if (!_this.User.user || _this.User.user.auth !== true) {
    _this.Modal.loginModal.show();
  } else {
    _this.$state.go('.carousel', { index: index });
  }
};
ListController.prototype.getItemHeight = function(item, image) {
  // item with thumbnail image: 111px
  // item with no image: 94px
  return image ? 111 : 94;
};
ListController.$inject = ['$scope', '$log', '$state', 'ModalService', 'UserService', 'ArticleService', 'TrackService', 'items', 'title'];
module.controller('ListController', ListController);


var CarouselController = function($scope, $log, $state, $timeout, $ionicScrollDelegate, ArticleService, AdService, TrackService, items, active) {
  var _this                 = this;
  this.$scope               = $scope;
  this.$log                 = $log;
  this.$state               = $state;
  this.$timeout             = $timeout;
  this.$ionicScrollDelegate = $ionicScrollDelegate;
  this.items                = items;
  this.active               = active;
  this.current              = items[active];
  this.Articles             = ArticleService;
  this.Articles.current     = this.current;
  this.Track                = TrackService;
  this.Ads                  = AdService;

  _this.Track.page([this.current.title, _this.$state.current.data.tracking.type].join(' - '));
  _this.Track.page([this.Ads.ads[0].name, 'Ad'].join(' - '));
  this.$log.debug('carousel controller loaded!');
};
CarouselController.prototype.slide = function(index) {
  var _this    = this,
      pageType = _this.$state.current.data.tracking.type;

  _this.$ionicScrollDelegate.scrollTop();
  _this.current = _this.items[index];
  _this.Articles.current = _this.items[index];
  _this.Track.page([this.current.title, pageType].join(' - '));
  _this.Track.page([this.Ads.ads[0].name, 'Ad'].join(' - '));
};
CarouselController.$inject = ['$scope', '$log', '$state', '$timeout', '$ionicScrollDelegate', 'ArticleService', 'AdService', 'TrackService', 'items', 'active'];
module.controller('CarouselController', CarouselController);



var SettingsController = function($scope, $log, $state, UserService, ModalService, FormService, TrackService) {
  var _this             = this;
  this.$scope           = $scope;
  this.$log             = $log;
  this.$state           = $state;
  this.User             = UserService;
  this.Modal            = ModalService;
  this.Form             = FormService;
  this.Track            = TrackService;
  this.contactFormName  = this.User.user ? [this.User.user.nameFirst, this.User.user.nameLast].join(' ') : '';
  this.contactFormEmail = this.User.user ? this.User.user.email : '';

  if (this.$state.current.name === 'main.tabs.settings') this.Track.page('Settings');
  this.$log.debug('settings controller loaded!');
};
SettingsController.prototype.submitContactForm = function() {
  var _this   = this,
      promise = _this.Form.submitContactForm(this.contactFormName,
                  this.contactFormCompany,
                  this.contactFormEmail,
                  this.contactFormMessage);

  _this.submitting = true;
  promise.then(function() {
    _this.submitting = false;
    _this.Modal.contactModal.hide();
  });
  return promise;
};
SettingsController.prototype.openUrl = function(url) {
  var _this = this;
  window.open(url, '_blank', 'location=yes', 'closebuttoncaption=back');
};
SettingsController.prototype.openEmail = function(to, subject) {
  var _this = this;
  window.plugin.email.open({to: [to], subject: subject});
};
SettingsController.$inject = ['$scope', '$log', '$state', 'UserService', 'ModalService', 'FormService', 'TrackService'];
module.controller('SettingsController', SettingsController);


var UserController = function($scope, $log, $state, ModalService, TrackService, UserService) {
  var _this   = this;
  this.$scope = $scope;
  this.$log   = $log;
  this.$state = $state;
  this.User   = UserService;
  this.Modal  = ModalService;
  this.Track  = TrackService;
  this.$log.debug('user controller loaded!');
};
UserController.prototype.authenticate = function(username, password) {
  var _this   = this,
      promise = _this.User.authenticate(username, password);

  _this.authenticating = true;
  promise.then(function() {
    _this.authenticating = false;
    if (_this.User.user.auth === true) {
      _this.Track.user(_this.User.user.userId);
      _this.Modal.loginModal.hide();
    }
  });
  return promise;
};
UserController.prototype.reset = function(username) {
  var _this   = this,
      promise = _this.User.resetPassword(username);

  _this.authenticating = true;
  promise.then(function() {
    _this.authenticating = false;
  });

  return promise;
};
UserController.prototype.logout = function() {
  var _this   = this,
      promise = _this.User.logout(),
      email   = _this.User.user.email;

  _this.loggingout = true;
  promise.then(function() {
    _this.loggingout = false;
    _this.Track.user(null);
  });

  return promise;
};
UserController.$inject = ['$scope', '$log', '$state', 'ModalService', 'TrackService', 'UserService'];
module.controller('UserController', UserController);