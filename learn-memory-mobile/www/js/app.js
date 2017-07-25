angular.module('LearnMemory', ['ngRoute', 'ngStorage', 'ngSanitize', 'ngTouch', 'pascalprecht.translate'])
.config(function ($routeProvider, $translateProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'views/home.html',
        controller: 'LearnMemoryHomeCtrl'
    })
    .when('/lessons', {
        templateUrl: 'views/list.html',
        controller: 'LearnMemoryListCtrl'
    })
    .when('/lessons/:id', {
        templateUrl: 'views/lesson.html',
        controller: 'LearnMemoryItemCtrl'
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

    $rootScope.synchronize = false;
    $rootScope.nav = 'home';

    if (!$localStorage.adress) {

        $scope.start = function () {
            $localStorage.adress = $scope.adress;
            $location.path('/lessons');
        };
    } else {
        $location.path('/lessons');
    }
}).controller('LearnMemoryListCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $translate, $q) {

    var diff = function (a, b) {
      var bIds = {}
      b.forEach(function(obj) {
          bIds[obj.id] = obj;
      });
      return a.filter(function(obj) {
          return !(obj.id in bIds);
      }).map(function(obj) {
          return obj.id;
      });
    };

    var getKey = function (array, id) {
        var i = 0;
        for(var item in array) {
            if(array[item].id == id) {
              return i;
              break;
            }
            i++;
        }
    };

    var synchronize = function (verbose) {
      var endSync = function () {
        $translate(['all_lesson_downloaded', 'ok', 'done']).then(function (translations) {
          SpinnerPlugin.activityStop();
          if (verbose) {
            navigator.notification.alert(translations.all_lesson_downloaded, null, translations.done, translations.ok);
          }
        });
      };

      var cannotConnect = function() {
        $translate(['cannot_connect', 'ok', 'error']).then(function (translations) {
          if (verbose) {
            SpinnerPlugin.activityStop();
            navigator.notification.alert(translations.cannot_connect, null, translations.error, translations.ok);
          }
        });
      };

      if ($localStorage.offline.length === 0) {
        if (verbose) {
          $translate('loading').then(function (translation) {
            SpinnerPlugin.activityStart(translation + '...', { dimBackground: true });
          });
        }
        $http.get('http://' + $localStorage.adress + '/api?createdAt&content&attachments').success(function (data) {
            $localStorage.offline = data;
            endSync();
        }).error(cannotConnect);
      } else {
        if (verbose) {
          $translate('loading').then(function (translation) {
            SpinnerPlugin.activityStart(translation + '...', { dimBackground: true });
          });
        }
        $http.get('http://' + $localStorage.adress + '/api').success(function (data) {

          var toDelete = diff($localStorage.offline, data);
          var toDownload = diff(data, $localStorage.offline);

          toDelete.forEach(function(id) {
            $localStorage.offline.splice(getKey($localStorage.offline, id), 1);
          });

          $localStorage.offline.forEach(function (item) {
            for (var i in data) {
              if (data[i].id == item.id) {
                if (new Date(data[i].updatedAt).getTime() > new Date(item.updatedAt).getTime()) {
                  toDownload.push(item.id);
                }
                break;
              }
            }
          });

          var requests = [];
          toDownload.forEach(function (id) {
            requests.push($http.get('http://' + $localStorage.adress + '/api/' + id));
          });

          $q.all(requests).then(function(values) {
              values.forEach(function (value) {

                var key = 0;
                for (var i in $localStorage.offline) {
                  if (value.data.id == $localStorage.offline[i].id) {
                    key = i;
                    break;
                  }
                }

                value.data.keywords = value.data.content.replace(/&#39;/gi, '\'')
                                              .replace(/\n/gi, ' ')
                                              .replace(/<.[^>]*>/gi, '')
                                              .replace(/&quot/gi, '"')
                                              .substring(0, 100);

                if (key) {
                    $localStorage.offline[key] = value.data;
                } else {
                    $localStorage.offline.push(value.data);
                }
              });
              endSync();
          }).catch(cannotConnect);

        }).error(cannotConnect);
      }
      $scope.lessons = $localStorage.offline;
      $localStorage.synchronized = (new Date());
    };

    if (!$localStorage.synchronized || ((new Date()) - new Date($localStorage.synchronized)) > 600000) {
      synchronize(false);
    }


    $rootScope.synchronize = function () {
          synchronize(true);
    };

    $scope.goLesson = function (lesson) {
          $location.path('/lessons/' + lesson.id);
    };

    $scope.lessons = $localStorage.offline;
}).controller('LearnMemoryItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams, $translate) {
      $rootScope.synchronize = false;

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

    $rootScope.synchronize = false;

    $scope.adress = $localStorage.adress;

    $scope.update = function () {
        $localStorage.adress = $scope.adress;
        $translate(['adress_updated', 'ok', 'updated']).then(function (translations) {
          navigator.notification.alert(translations.adress_updated, null, translations.updated, translations.ok);
        });
    };
});
