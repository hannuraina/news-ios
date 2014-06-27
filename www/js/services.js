var module = angular.module('pi-news.services', []);

var APIKEY      = '7803c9c9f39e6d58a831a8f10df0d1394a94e38d',
    APIURL      = 'http://api.pionline.com',
    ACCOUNTURL  = 'http://account.pionline.com',
    ADMINURL    = 'http://admin.pionline.com',
    TIMEOUT     = 5000;

var ArticleService = function($log, $http, $localStorage, $filter, $q) {
  this.apiKey         = APIKEY;
  this.apiUrl         = APIURL;
  this.serviceTimeout = TIMEOUT;
  this.$log           = $log;
  this.$http          = $http;
  this.$storage       = $localStorage;
  this.$filter        = $filter;
  this.$q             = $q;

  this.latest         = angular.fromJson(this.$storage.latest);
  this.articles       = angular.fromJson(this.$storage.articles);
  this.charts         = angular.fromJson(this.$storage.charts);
  this.slideshows     = angular.fromJson(this.$storage.slideshows);
  this.sections       = angular.fromJson(this.$storage.sections);
  this.saved          = angular.fromJson(this.$storage.saved);
};
ArticleService.prototype.saveArticle = function(article) {
  var _this = this;
  _this.saved = _this.$storage.saved ? angular.fromJson(_this.$storage.saved) : [];
  _this.saved.push(article);
  _this.$storage.saved = angular.toJson(_this.saved);
};
ArticleService.prototype.removeArticle = function(article) {
  var _this = this;
  _this.saved = _this.$filter('filter')(angular.fromJson(this.$storage.saved), { saxotech_id: '!' + article.saxotech_id });
  _this.$storage.saved = angular.toJson(_this.saved);
};
ArticleService.prototype.fetchLatest = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/articles/latest',
    async : true,
    timeout: _this.serviceTimeout,
    params: {
      key:    _this.apiKey,
      callback: 'JSON_CALLBACK',
      format: true
    }
  })
  // update offline dataset
  .success(function(data, status) {
    _this.$log.debug('latest loaded');
    data = data;
    data = _this.$filter('filter')(data, { sectionHeader: 'Latest News'});
    data = _this.$filter('orderBy')(data, ['-published', 'priority']);
    _this.latest = data;
    _this.$storage.latest = angular.toJson(data);
    defer.resolve({data: _this.latest});
  })
  // keep existing offline dataset
  .error(function(data, status) {
    defer.resolve();
  });

  return defer.promise;
};
ArticleService.prototype.fetchArticles = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/articles',
    async : true,
    timeout: _this.serviceTimeout,
    params: {
      key:    _this.apiKey,
      callback: 'JSON_CALLBACK',
      sort:   'published',
      order:  'DESC',
      limit: 350,
      format: true
    }
  })
  // update offline dataset
  .success(function(data, status) {
    _this.$log.debug('articles loaded');
    _this.articles = data;
    _this.$storage.articles = angular.toJson(_this.articles);
    defer.resolve();
  })
  // keep existing offline dataset
  .error(function(data, status) {
    defer.resolve();
  });

  return defer.promise;
};
ArticleService.prototype.fetchCharts = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/articles/charts',
    async : true,
    timeout: _this.serviceTimeout,
    params: {
      key:    _this.apiKey,
      sort: 'published',
      order: 'DESC',
      limit: 15,
      format: true,
      callback: 'JSON_CALLBACK'
    }
  })
  .success(function(data, status) {
    _this.$log.debug('charts loaded');
    _this.charts = [];
    angular.forEach(data, function(d, index) {
      if (d.image) _this.charts.push(d);
    });
    _this.$storage.charts = angular.toJson(_this.charts);
    defer.resolve();
  })
  .error(function(data, status) {
    defer.resolve();
  });

  return defer.promise;
};
ArticleService.prototype.fetchSlideshows = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/articles/slideshows',
    timeout: _this.serviceTimeout,
    async : true,
    params: {
      key:    _this.apiKey,
      sort: 'published',
      order: 'DESC',
      limit: 20,
      format: 'true',
      category: 'SLIDESHOW,SLIDESHOW2',
      callback: 'JSON_CALLBACK'
    }
  })
  .success(function(data, status) {
    _this.$log.debug('slideshows loaded');
    _this.slideshows = [];
    angular.forEach(data, function(d, index) {
      if (d.image[0]) _this.slideshows.push(d);
    });
    _this.$storage.slideshows = angular.toJson(_this.slideshows);
    defer.resolve();
  })
  .error(function(data, status) {
    defer.resolve();
  });

  return defer.promise;
};
ArticleService.prototype.fetchSections = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/articles/themes',
    timeout: _this.serviceTimeout,
    async : true,
    params: {
      key:    _this.apiKey,
      callback: 'JSON_CALLBACK'
    }
  })
  .success(function(data, status) {
    _this.sections = [];

    _this.$log.debug('sections loaded');

    // replace slashes
    angular.forEach(data, function(item, idx) {
      data[idx].name = data[idx].name.replace('/', ' and ');
    });

    // remove unused sections from legacy app
    data = _this.$filter('filter')(data, { active: 'true' });
    data = _this.$filter('filter')(data, { name: '!Chart Central' });
    data = _this.$filter('filter')(data, { name: '!Slideshows' });
    data = _this.$filter('filter')(data, { name: '!Most Popular' });

    //breakdown section articles
    angular.forEach(data, function(section, idx) {
      if (section.guids) {
        data[idx].stories = _this.$filter('filter')(_this.articles, function(article) {
          return section.guids.indexOf(article.saxotech_id) > -1;
        }).slice(0, 15);
      } else if (section.theme) {
        data[idx].stories = _this.$filter('filter')(_this.articles, function(article) {
          return section.theme === article.theme;
        }).slice(0, 15);
      } else if (section.taxonomy) {
        data[idx].stories = _this.$filter('filter')(_this.articles, function(article) {
          return article.taxonomy && article.taxonomy.indexOf(section.taxonomy) > -1;
        }).slice(0, 15);
      }

      // remove empty section headers
      if (data[idx].stories.length) {
        _this.sections.push(data[idx]);
      }
    });

    // store in localstorage
    _this.$storage.sections = angular.toJson(_this.sections);
    defer.resolve();
  })
  .error(function(data, status) {
    defer.resolve();
  });

  return defer.promise;
};
ArticleService.$inject = ['$log', '$http', '$localStorage', '$filter', '$q'];
module.service('ArticleService', ArticleService);


var UserService = function($log, $http, $localStorage, $filter, $timeout, $q) {
  var _this           = this;
  this.apiUrl         = ACCOUNTURL;
  this.serviceTimeout = TIMEOUT;
  this.$log           = $log;
  this.$http          = $http;
  this.$storage       = $localStorage;
  this.$filter        = $filter;
  this.$timeout       = $timeout;
  this.$q             = $q;

  this.error = null;
  this.user  = angular.fromJson(this.$storage.user);
};
UserService.prototype.logout = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$timeout(function() {
    _this.user = {};
    _this.$storage.user = angular.toJson(_this.user);
    defer.resolve();
  }, 1000);

  return defer.promise;
};
UserService.prototype.authenticate = function(username, password) {
  var _this = this,
      defer = _this.$q.defer();

   _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/auth/mobile',
    timeout: _this.serviceTimeout,
    async : true,
    params: {
      callback: 'JSON_CALLBACK',
      CSUsername: username.toLowerCase(),
      CSPassword: password
    }
  })
  .success(function(data, status) {
    if (data.error) {
      _this.error = data.error;
    } else {
      _this.error = null;
      _this.user = data;
      _this.user.contactFormName = [data.nameFirst, data.nameLast].join(' ');
      _this.user.contactFormEmail = data.email;
      _this.$storage.user = angular.toJson(_this.user);
    }
    defer.resolve();
  })
  .error(function(data, status) {
    _this.error = 'Login service unavailable';
    defer.resolve();
  });

  return defer.promise;
};
UserService.prototype.resetPassword = function(username) {
  var _this = this;

  return _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/auth/csResetPassword',
    timeout: _this.serviceTimeout,
    async : true,
    params: {
      callback: 'JSON_CALLBACK',
      CSUsername: username
    }
  })
  .success(function(data, status) {
    if (data.error) {
      _this.error = data.error;
    } else {
      _this.error = 'Instructions have been emailed';
    }
  })
  .error(function(data, status) {});
};
UserService.$inject = ['$log', '$http', '$localStorage', '$filter', '$timeout', '$q'];
module.service('UserService', UserService);


var ModalService = function($log, $ionicModal) {
  var _this        = this;
  this.$log        = $log;
  this.$ionicModal = $ionicModal;

  // initialize login screen
  this.$ionicModal.fromTemplateUrl('templates/modal.login.html', {
    animation: 'slide-in-up'
  }).then(function(modal) {
    _this.loginModal = modal;
  });

  // initialize login screen
  this.$ionicModal.fromTemplateUrl('templates/modal.contact.html', {
    animation: 'slide-in-up'
  }).then(function(modal) {
    _this.contactModal = modal;
  });
};
ModalService.$inject = ['$log', '$ionicModal'];
module.service('ModalService', ModalService);


var ConfigService = function($log, $localStorage) {
  var _this     = this;
  this.$log     = $log;
  this.$storage = $localStorage;
  this.config   = angular.fromJson(_this.$storage.config);
};
ConfigService.prototype.getConfig = function() {
  var _this  = this;

  // initialize application styles
  if (!_this.config) {
    _this.config = {};
    _this.config.style = {};
    _this.config.style['font-size'] = '100%';
    _this.saveConfig(_this.config);
  }

  return angular.fromJson(_this.$storage.config);
};
ConfigService.prototype.saveConfig = function(config) {
  var _this = this;
  _this.$storage.config = angular.toJson(config);
};
ConfigService.$inject = ['$log', '$localStorage'];
module.service('ConfigService', ConfigService);


var SearchService = function($log, $http, $localStorage, $filter, $q) {
  var _this           = this;
  this.apiKey         = APIKEY;
  this.apiUrl         = APIURL;
  this.serviceTimeout = TIMEOUT;
  this.$log           = $log;
  this.$http          = $http;
  this.$storage       = $localStorage;
  this.$filter        = $filter;
  this.$q             = $q;
};
SearchService.prototype.fetchOfflineSearch = function() {
  var _this    = this,
      articles = angular.fromJson(_this.$storage.articles);

  if (!_this.query || _this.query.length < 4) {
    _this.offlineResults = [];
    _this.onlineResults = [];
  } else {
    _this.offlineResults = _this.$filter('filter')(articles, _this.query);
  }
};
SearchService.prototype.fetchOnlineSearch = function() {
  var _this = this,
      defer = _this.$q.defer();

  _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/articles/ramp',
    timeout: _this.serviceTimeout,
    async : true,
    params: {
      key:    _this.apiKey,
      callback: 'JSON_CALLBACK',
      q: _this.query
    }
  })
  // update offline dataset
  .success(function(data, status) {
    _this.onlineResults = data;
    defer.resolve();
  })
  // keep existing offline dataset
  .error(function(data, status) {
    _this.onlineResults = [];
    defer.resolve();
  });

  return defer.promise;
};
SearchService.$inject = ['$log', '$http', '$localStorage', '$filter', '$q'];
module.service('SearchService', SearchService);


var FormService = function($log, $http) {
  var _this           = this;
  this.apiUrl         = ADMINURL;
  this.serviceTimeout = TIMEOUT;
  this.$log           = $log;
  this.$http          = $http;
};
FormService.prototype.submitContactForm = function(name, company, email, message) {
  var _this = this,
      data  = angular.toJson({
        'Name': name,
        'E-mail': email,
        'Company': company,
        'Message': message
      });
  return _this.$http({
    method: 'jsonp',
    url: _this.apiUrl + '/mobile/send_feedback',
    timeout: _this.serviceTimeout,
    async : true,
    params: {
      callback: 'JSON_CALLBACK',
      data: data
    }
  })
  .success(function(data, status) {})
  .error(function(data, status) {});
};
FormService.$inject = ['$log', '$http'];
module.service('FormService', FormService);


var AdService = function($log, $http, $filter, $timeout, $localStorage, $q) {
  var _this           = this;
  this.apiUrl         = ADMINURL;
  this.serviceTimeout = TIMEOUT;
  this.$log           = $log;
  this.$http          = $http;
  this.$timeout       = $timeout;
  this.$storage       = $localStorage;
  this.$filter        = $filter;
  this.$q             = $q;

  this.ads = angular.fromJson(this.$storage.ads);
};
AdService.prototype.fetchAds = function() {
  var _this = this,
      defer = _this.$q.defer();

   _this.$timeout(function() {
    data = [{
      campaign: "pi-unlimited",
      email: "mailto:pmargolis@pionline.com",
      name: "pi-unlimited_banner",
      subject: "Enterprise License Inquiry from P&I News App",
      type: "banner"
    }];
    _this.ads = data;
    console.log(_this.ads);
    _this.$storage.ads = angular.toJson(_this.ads);
    defer.resolve();
  }, 500);

  return defer.promise;
};
AdService.$inject = ['$log', '$http', '$filter', '$timeout', '$localStorage', '$q'];
module.service('AdService', AdService);


var TrackService = function($log) {
  var _this           = this;
  this.$log           = $log;
  this.apiUrl         = ADMINURL;
  this.serviceTimeout = TIMEOUT;
};
TrackService.prototype.user = function(userId) {
  var _this = this;

  _this.$log.debug('Track user ' + userId);
  if (typeof analytics !== 'undefined') {
    analytics.setUserId(userId);
  }
};
TrackService.prototype.page = function(page) {
  var _this = this;

  _this.$log.debug('Track page ' + page);
  if (typeof analytics !== 'undefined') {
    analytics.trackView(page);
  }
};
TrackService.$inject = ['$log'];
module.service('TrackService', TrackService);