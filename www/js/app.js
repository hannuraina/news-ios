var app = angular.module('pi-news', [
  'ionic',
  'ngStorage',
  'ngCordova',
  'pasvaz.bindonce',
  'pi-news.controllers',
  'pi-news.services'
]);

app.config(['$stateProvider', '$urlRouterProvider', '$logProvider',
  function($stateProvider, $urlRouterProvider, $logProvider) {
    $logProvider.debugEnabled(false);
    $stateProvider
    .state('main', {
      url: '',
      abstract: true,
      resolve: {
        config: function(ConfigService) {
          return ConfigService.getConfig();
        },
        plugins: function() {
          ionic.Platform.ready(function() {
            if (typeof navigator.splashscreen !== 'undefined') {
              setTimeout(function() {
                navigator.splashscreen.hide();
              }, 500);
            }
            if (typeof analytics !== 'undefined') {
              analytics.startTrackerWithId('UA-2647193-2');
            }
          });
        }
      },
      views: {
        'main-content': {
          controller: 'AppController as appCtrl',
          templateUrl: 'templates/app.html'
        }
      }
    })
    .state('main.tabs', {
      url: '/tabs',
      abstract: true,
      resolve: {
        latest: function(ArticleService) {
          return ArticleService.fetchLatest();
        },
        articles: function(ArticleService) {
          return ArticleService.fetchArticles();
        },
        sections: function(ArticleService, articles) {
          return ArticleService.fetchSections();
        },
        charts: function(ArticleService) {
          return ArticleService.fetchCharts();
        },
        slideshows: function(ArticleService) {
          return ArticleService.fetchSlideshows();
        },
        ads: function(AdService) {
          return AdService.fetchAds();
        }
      },
      views: {
        'menu-content': {
          controller: 'ArticleController as articleCtrl',
          templateUrl: 'templates/tabs.html',
        }
      }
    })
    .state('main.tabs.latest', {
      url: '/latest',
      data: {
        tracking: {
          type: 'Article'
        }
      },
      resolve: {
        items: function(ArticleService, latest) {
          return ArticleService.latest;
        },
        title: function() {
          return 'Latest News';
        }
      },
      views: {
        'latest-tab': {
          controller: 'ListController as listCtrl',
          templateUrl: 'templates/list.html'
        }
      }
    })
    .state('main.tabs.latest.carousel', {
      url: '/carousel/{index}',
      resolve: {
        active: function($stateParams) {
          return $stateParams.index;
        }
      },
      views: {
        'latest-tab@main.tabs': {
          controller: 'CarouselController as carouselCtrl',
          templateUrl: 'templates/carousel.article.html'
        }
      }
    })
    .state('main.tabs.sections', {
      url: '/sections',
      data: {
        tracking: {
          type: 'Article'
        }
      },
      resolve: {
        items: function(ArticleService) {
          return ArticleService.sections;
        },
        title: function() {
          return 'Sections';
        }
      },
      views: {
        'sections-tab': {
          controller: 'ListController as listCtrl',
          templateUrl: 'templates/sections.html'
        }
      }
    })
    .state('main.tabs.sections.list', {
      url: '/:section',
      resolve: {
        items: function($stateParams, $filter, ArticleService) {
          var selection = $filter('filter')(ArticleService.sections, { name: $stateParams.section })[0];
          return selection.stories;
        },
        title: function($stateParams) {
          return $stateParams.section;
        }
      },
      views: {
        'sections-tab@main.tabs': {
          controller: 'ListController as listCtrl',
          templateUrl: 'templates/list.html'
        }
      }
    })
    .state('main.tabs.sections.list.carousel', {
      url: '/carousel/:index',
      resolve: {
        active: function($stateParams) {
          return $stateParams.index;
        }
      },
      views: {
        'sections-tab@main.tabs': {
          controller: 'CarouselController as carouselCtrl',
          templateUrl: 'templates/carousel.article.html'
        }
      }
    })
    .state('main.tabs.charts', {
      url: '/charts',
      data: {
        tracking: {
          type: 'Chart'
        }
      },
      resolve: {
        items: function(ArticleService) {
          return ArticleService.charts;
        },
        title: function() {
          return 'Chart Central';
        }
      },
      views: {
        'charts-tab': {
          controller: 'ListController as listCtrl',
          templateUrl: 'templates/list.html'
        }
      }
    })
    .state('main.tabs.charts.carousel', {
      url: '/carousel/:index',
      resolve: {
        active: function($stateParams) {
          return $stateParams.index;
        }
      },
      views: {
        'charts-tab@main.tabs': {
          controller: 'CarouselController as carouselCtrl',
          templateUrl: 'templates/carousel.chart.html'
        }
      }
    })
    .state('main.tabs.slideshows', {
      url: '/slideshows',
      data: {
        tracking: {
          type: 'Slideshow'
        }
      },
      resolve: {
        items: function(ArticleService) {
          return ArticleService.slideshows;
        },
        title: function() {
          return 'Slideshows';
        }
      },
      views: {
        'slideshows-tab': {
          controller: 'ListController as listCtrl',
          templateUrl: 'templates/list.html'
        }
      }
    })
    .state('main.tabs.slideshows.carousel', {
      url: '/carousel/:index',
      resolve: {
        items: function(ArticleService, $stateParams) {
          return ArticleService.slideshows[$stateParams.index].image;
        },
        active: function($stateParams) {
          return $stateParams.index;
        }
      },
      views: {
        'slideshows-tab@main.tabs': {
          controller: 'CarouselController as carouselCtrl',
          templateUrl: 'templates/carousel.slideshow.html'
        }
      }
    })
    .state('main.tabs.saved', {
      url: '/saved',
      data: {
        tracking: {
          type: 'Article'
        }
      },
      resolve: {
        items: function(ArticleService) {
          return ArticleService.saved;
        },
        title: function() {
          return 'Saved Articles';
        }
      },
      views: {
        'saved-tab': {
          controller: 'ListController as listCtrl',
          templateUrl: 'templates/list.html'
        }
      }
    })
    .state('main.tabs.saved.carousel', {
      url: '/carousel/{index}',
      resolve: {
        active: function($stateParams) {
          return $stateParams.index;
        }
      },
      views: {
        'saved-tab@main.tabs': {
          controller: 'CarouselController as carouselCtrl',
          templateUrl: 'templates/carousel.article.html'
        }
      }
    })
    .state('main.tabs.search', {
      url: '/search',
      data: {
        tracking: {
          type: 'Search'
        }
      },
      views: {
        'search-tab': {
          controller: 'SearchController as searchCtrl',
          templateUrl: 'templates/search.html'
        }
      }
    })
    .state('main.tabs.search.carousel', {
      url: '/carousel/{index}',
      resolve: {
        items: function(SearchService) {
          return SearchService.offlineResults;
        },
        active: function($stateParams) {
          return $stateParams.index;
        }
      },
      views: {
        'search-tab@main.tabs': {
          controller: 'CarouselController as carouselCtrl',
          templateUrl: 'templates/carousel.article.html'
        }
      }
    })
    .state('main.tabs.settings', {
      url: '/settings',
      data: {
        tracking: {
          type: 'Settings'
        }
      },
      views: {
        'settings-tab': {
          controller: 'SettingsController as settingsCtrl',
          templateUrl: 'templates/settings.html'
        }
      }
    })
    .state('main.tabs.settings.privacy', {
      url: '/privacy',
      views: {
        'settings-tab@main.tabs': {
          controller: 'SettingsController as settingsCtrl',
          templateUrl: 'templates/settings.privacy.html'
        }
      }
    })
    .state('main.tabs.settings.terms', {
      url: '/terms',
      views: {
        'settings-tab@main.tabs': {
          templateUrl: 'templates/settings.terms.html'
        }
      }
    })
    .state('main.tabs.settings.about', {
      url: '/about',
      views: {
        'settings-tab@main.tabs': {
          templateUrl: 'templates/settings.about.html'
        }
      }
    });

    $urlRouterProvider.otherwise('/tabs/latest');
}]);