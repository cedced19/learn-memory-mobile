angular.module('LearnMemory', ['ngRoute', 'ngStorage', 'ngSanitize', 'ngTouch', 'pascalprecht.translate'])
.config(function ($routeProvider, $translateProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'views/home.html',
        controller: 'LearnMemoryHomeCtrl'
    })
    .when('/download', {
        templateUrl: 'views/list.html',
        controller: 'LearnMemoryDownloadCtrl'
    })
    .when('/download/:id', {
        templateUrl: 'views/lesson.html',
        controller: 'LearnMemoryDownloadItemCtrl'
    })
    .when('/offline', {
        templateUrl: 'views/list.html',
        controller: 'LearnMemoryOfflineCtrl'
    })
    .when('/offline/:id', {
        templateUrl: 'views/lesson.html',
        controller: 'LearnMemoryOfflineItemCtrl'
    })
    .when('/config', {
        templateUrl: 'views/config.html',
        controller: 'LearnMemoryConfigCtrl'
    })
    .otherwise({
        redirectTo: '/'
    });

    $translateProvider
    .useStaticFilesLoader({
        prefix: 'langs/locale-',
        suffix: '.json'
    })
    .registerAvailableLanguageKeys(['en', 'fr'], {
      'fr_*': 'fr',
      'en_*': 'en',
      '*': 'en'
    })
    .useSanitizeValueStrategy(null)
    .determinePreferredLanguage()
    .fallbackLanguage('en');
})
.run(function ($rootScope, $location) {
    $rootScope.$menu = {
        show: function () {
            if ($rootScope.nav != 'home') {
                document.getElementsByTagName('body')[0].classList.add('with-sidebar');
            }
        },
        hide: function (path) {
            document.getElementsByTagName('body')[0].classList.remove('with-sidebar');
            if (path) {
                $location.path('/' + path);
            }
        }
    };

    $rootScope.$on('$routeChangeSuccess', function(event, next, current) {
          $rootScope.nav = $location.path().substring(1);
    });
})
.controller('LearnMemoryHomeCtrl', function ($scope, $rootScope, $location, $localStorage) {
    $localStorage.$default({
        adress: '',
        offline: []
    });

    $rootScope.download = false;
    $rootScope.nav = 'home';

    if (!$localStorage.adress) {

        $scope.start = function () {
            $localStorage.adress = $scope.adress;
            $location.path('/download');
        };
    } else {
        $location.path('/download');
    }
}).controller('LearnMemoryDownloadCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $translate) {

    $http.get('http://' + $localStorage.adress + '/api/').success(function (data) {
        $scope.items = data;

        $scope.goItem = function (item) {
            $location.path('/download/' + item.id);
        };

        $rootScope.download = function () {
          $translate('loading').then(function (translation) {
            SpinnerPlugin.activityStart(translation + '...', { dimBackground: true });
            $http.get('http://' + $localStorage.adress + '/api/long').success(function (data) {
                $localStorage.offline = data;
                $translate(['all_lesson_downloaded', 'ok', 'done']).then(function (translations) {
                  $location.path('/offline');
                  SpinnerPlugin.activityStop();
                  navigator.notification.alert(translations.all_lesson_downloaded, null, translations.done, translations.ok);
                });
            }).error(function () {
                $translate(['cannot_connect', 'ok', 'error']).then(function (translations) {
                  SpinnerPlugin.activityStop();
                  navigator.notification.alert(translations.cannot_connect, null, translations.error, translations.ok);
                });
            });
          });
        };

    }).error(function () {
        $location.path('/offline');
    });
}).controller('LearnMemoryDownloadItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams, $translate) {

    $http.get('http://' + $localStorage.adress + '/api/' + $routeParams.id).success(function (data) {
        $scope.item = data;

        $rootScope.download = function () {
                var exist = false;
                angular.forEach($localStorage.offline, function (value, key) {
                    if (value.id == $routeParams.id) {
                        exist = key;
                    }
                });

                data.keywords = data.content
                    .replace(/&#39;/gi, '\'')
                    .replace(/\n/gi, ' ')
                    .replace(/<.[^>]*>/gi, '')
                    .replace(/&quot/gi, '"')
                    .substring(0, 100);

                if (exist) {
                    $localStorage.offline[exist] = data;
                } else {
                    $localStorage.offline.push(data);
                }
                $translate(['a_lesson_downloaded', 'ok', 'done']).then(function (translations) {
                  navigator.notification.alert(translations.a_lesson_downloaded, null, translations.done, translations.ok);
                });
                $rootScope.download = false;
        };

        $scope.share = function () {
          $translate(['pick_an_app', 'lesson_of']).then(function (translations) {
            var options = {
              message: translations.lesson_of + ' ' + $scope.item.substance + ': http://' + $localStorage.adress + '/#/lessons/' + $routeParams.id,
              title: translations.pick_an_app
            };
            sharetext(options.message, options.title);
          });
        };

        document.getElementById('lesson-content').onclick = function (e) {
            e = e || window.event;
            var element = e.target || e.srcElement;

            if (element.tagName == 'A') {
                window.open(element.href, '_system');
                return false;
            }
        };
    }).error(function () {
        $location.path('/offline/' + $routeParams.id);
    });
}).controller('LearnMemoryOfflineCtrl', function ($scope, $rootScope, $location, $localStorage) {

    $rootScope.download = false;

    $scope.items = $localStorage.offline;
    document.getElementById('container').scrollTop = 0;

    $scope.goItem = function (item) {
        $location.path('/offline/' + item.id);
    };
}).controller('LearnMemoryOfflineItemCtrl', function ($scope, $rootScope, $location, $localStorage, $routeParams, $translate) {

    $rootScope.nav = false;
    $rootScope.download = false;

    angular.forEach($localStorage.offline, function (value, key) {
        if (value.id == $routeParams.id) {
            $scope.item = value;
            $scope.item.content = $scope.item.content.replace(/<img [^>]*src=".*?[^\]"[^>]*\/>/gi, '<p class="lesson-error">Images can\'t be show in offline mode.</p>');
            document.getElementById('container').scrollTop = 0;
        }
    });

    $scope.share = function () {
      $translate(['pick_an_app', 'lesson_of']).then(function (translations) {
        var options = {
          message: translations.lesson_of + ' ' + $scope.item.substance + ': http://' + $localStorage.adress + '/#/lessons/' + $routeParams.id,
          title: translations.pick_an_app
        };
        sharetext(options.message, options.title);
      });
    };

    document.getElementById('lesson-content').onclick = function (e) {
        e = e || window.event;
        var element = e.target || e.srcElement;

        if (element.tagName == 'A') {
            window.open(element.href, '_system');
            return false;
        }
    };
}).controller('LearnMemoryConfigCtrl', function ($scope, $rootScope, $location, $localStorage, $translate) {

    $rootScope.download = false;

    $scope.adress = $localStorage.adress;

    $scope.update = function () {
        $localStorage.adress = $scope.adress;
        $translate(['adress_updated', 'ok', 'updated']).then(function (translations) {
          navigator.notification.alert(translations.adress_updated, null, translations.updated, translations.ok);
        });
    };
});
