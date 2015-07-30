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
}).controller('LearnMemoryDownloadCtrl', function ($scope, $rootScope, $location, $localStorage, $http) {
    $http.get('http://' + $localStorage.adress + '/api/').success(function (data) {
        $rootScope.nav = 'download';

        $scope.items = data;

        $scope.goItem = function (item) {
            $location.path('/download/' + item.id);
        };

        $rootScope.download = function () {
            $http.get('http://' + $localStorage.adress + '/api/long').success(function (data) {
                $localStorage.offline = data;
                $location.path('/offline');
            });
        };

    }).error(function () {
        $location.path('/offline');
    });
}).controller('LearnMemoryDownloadItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams) {
    $http.get('http://' + $localStorage.adress + '/api/' + $routeParams.id).success(function (data) {
        $rootScope.nav = false;
        $rootScope.download = false;

        $scope.item = data;

    }).error(function () {
        $location.path('/offline/' + $routeParams.id);
    });
}).controller('LearnMemoryOfflineCtrl', function ($scope, $rootScope, $location, $localStorage, $http) {
    $rootScope.nav = 'offline';
    $rootScope.download = false;

    $scope.items = $localStorage.offline;

    $scope.goItem = function (item) {
        $location.path('/offline/' + item.id);
    };
}).controller('LearnMemoryOfflineItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams) {
    $rootScope.nav = false;
    $rootScope.download = false;

    angular.forEach($localStorage.offline, function (value, key) {
        if (value.id == $routeParams.id) {
            $scope.item = value;
        }
    });
}).controller('LearnMemoryConfigCtrl', function ($scope, $rootScope, $location, $localStorage) {
    $rootScope.nav = 'config';
    $rootScope.download = false;

    $scope.adress = $localStorage.adress;

    $scope.update = function () {
        $localStorage.adress = $scope.adress;
    };
});