angular.module('LearnMemory', ['ngRoute', 'ngStorage', 'ngSanitize'])
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
        url: false,
        offline: []
    });

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

    }).error(function () {
        $location.path('/offline');
    });
}).controller('LearnMemoryDownloadItemCtrl', function ($scope, $rootScope, $location, $localStorage, $http, $routeParams) {
    $http.get('http://' + $localStorage.adress + '/api/' + $routeParams.id).success(function (data) {
        $rootScope.nav = false;

        $scope.item = data;
    }).error(function () {
        $location.path('/offline');
    });
}).controller('LearnMemoryConfigCtrl', function ($scope, $rootScope, $location, $localStorage) {
    $rootScope.nav = 'config';

    $scope.adress = $localStorage.adress;

    $scope.update = function () {
        $localStorage.adress = $scope.adress;
    };
});