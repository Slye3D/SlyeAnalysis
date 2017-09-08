/**
 *    _____ __
 *   / ___// /_  _____
 *   \__ \/ / / / / _ \
 *  ___/ / / /_/ /  __/
 * /____/_/\__, /\___/
 *       /____/
 *       Copyright 2017 Slye Development Team. All Rights Reserved.
 *       Licence: MIT License
 */
 'use strict';

 function timestamp() {
     return Math.floor(new Date().getTime() / 1000);
 }

 let $app = angular.module('sa', [
     'ngRoute',
     'chart.js',
     'sa.dashboard',
     'sa.view'
 ]);
 $app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
     $locationProvider.html5Mode(true);
     $routeProvider.otherwise({
         redirectTo: '/'
     });
 }]);
$app.run(function($rootScope){
    $rootScope.socket = io()
})
