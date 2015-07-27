angular.module('LearnMemory', ['ngRoute'])
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'views/home.html',
        controller: 'LearnMemoryHomeCtrl'
    })
    .otherwise({
        redirectTo: '/'
    });
}])
.controller('LearnMemoryHomeCtrl', function ($scope, $location, $http) {

});