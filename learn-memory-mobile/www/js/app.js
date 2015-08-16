angular.module('LearnMemory', ['ngRoute', 'ngStorage', 'ngSanitize', 'ngTouch'])
.config(['$routeProvider', function ($routeProvider) {
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
}])
.controller('LearnMemoryHomeCtrl', function ($scope, $rootScope, $location, $localStorage) {
    $localStorage.$default({
        adress: '',
        offline: []
    });

    $rootScope.download = false;

    $rootScope.showMenu = function () {
        document.getElementsByTagName('body')[0].classList.add('with-sidebar');
    };

    $rootScope.hideMenu = function (path) {
        document.getElementsByTagName('body')[0].classList.remove('with-sidebar');
        if (path) {
            $location.path('/' + path);
        }
    };

    if (!$localStorage.adress) {
        $rootScope.nav = 'home';

        $scope.start = function () {
            $localStorage.adress = $scope.adress;
            $scope.init = false;
            $location.path('/download');
        };
    } else {
        $location.path('/download');
    }
}).controller('LearnMemoryDownloadCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $anchorScroll) {
    $anchorScroll();

    $rootScope.nav = 'download';
    $http.get('http://' + $localStorage.adress + '/api/').success(function (data) {
        $scope.items = data;

        $scope.goItem = function (item) {
            $location.path('/download/' + item.id);
        };

        $rootScope.download = function () {
            $http.get('http://' + $localStorage.adress + '/api/long').success(function (data) {
                $localStorage.offline = data;
                navigator.notification.alert('All lessons have just been downloaded!', null, 'Done', 'Ok');
                $location.path('/offline');
            });
        };

    }).error(function () {
        $location.path('/offline');
    });
}).controller('LearnMemoryDownloadItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams, $anchorScroll) {
    $anchorScroll();

    $rootScope.nav = false;
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
                navigator.notification.alert('This lesson has just been downloaded!', null, 'Done', 'Ok');
                $location.path('/offline/' + $routeParams.id);
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
}).controller('LearnMemoryOfflineCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $anchorScroll) {
    $anchorScroll();

    $rootScope.nav = 'offline';
    $rootScope.download = false;

    $scope.items = $localStorage.offline;

    $scope.goItem = function (item) {
        $location.path('/offline/' + item.id);
    };
}).controller('LearnMemoryOfflineItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams, $anchorScroll) {
    $anchorScroll();

    $rootScope.nav = false;
    $rootScope.download = false;

    angular.forEach($localStorage.offline, function (value, key) {
        if (value.id == $routeParams.id) {
            
            $scope.item = value;
            $scope.item.content = $scope.item.content.replace(/<img [^>]*src=".*?[^\]"[^>]*\/>/gi, '<p class="lesson-error">Images can\'t be show in offline mode.</p>');
        }
    });

    document.getElementById('lesson-content').onclick = function (e) {
        e = e || window.event;
        var element = e.target || e.srcElement;

        if (element.tagName == 'A') {
            window.open(element.href, '_system');
            return false;
        }
    };
}).controller('LearnMemoryConfigCtrl', function ($scope, $rootScope, $location, $localStorage, $anchorScroll) {
    $anchorScroll();

    $rootScope.nav = 'config';
    $rootScope.download = false;

    $scope.adress = $localStorage.adress;

    $scope.update = function () {
        $localStorage.adress = $scope.adress;
        navigator.notification.alert('The adress has just been updated!', null, 'Done', 'Ok');
    };
});