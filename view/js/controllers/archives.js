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

 let $archives = angular.module('sa.archives', ['ngRoute']);
 $archives.config(['$routeProvider', function ($routeProvider) {
     $routeProvider.when('/view/:app/archives', {
         templateUrl: '/templates/archives.html',
         controller: 'ArchivesCtrl'
     });
 }]);

 $archives.controller("ArchivesCtrl", function ($scope, $timeout, $http, $routeParams) {
     $timeout(function(){
         componentHandler.upgradeAllRegistered();
     })
     $scope.app = $routeParams.app
     $scope.updateArchives  = function(){
         $timeout(function(){$scope.loading = true})
         $http.get("/archives/" + $scope.app).then(function(response) {
             $timeout(function(){
                 $scope.archives = response.data
                 $scope.loading = false
             }, 500)
        });
     }
     $scope.updateArchives()
 });
