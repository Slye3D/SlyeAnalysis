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

 let $dashboard = angular.module('sa.dashboard', ['ngRoute']);
 $dashboard.config(['$routeProvider', function ($routeProvider) {
     $routeProvider.when('/', {
         templateUrl: '/templates/dashboard.html',
         controller: 'DashboardCtrl'
     });
 }]);

 $dashboard.controller("DashboardCtrl", function ($scope, $timeout, $http) {
     $timeout(function(){
         componentHandler.upgradeAllRegistered();
     })
     $scope.updateApps  = function(){
         $timeout(function(){$scope.loading = true})
         $http.get("/apps").then(function(response) {
             $timeout(function(){
                 $scope.apps = response.data
                 $scope.loading = false
             }, 500)
        });
     }
     $scope.updateApps()
 });
