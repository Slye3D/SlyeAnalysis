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
     'sa.view',
     'sa.archives',
     'sa.archives.view'
 ]);
 $app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider, ChartJsProvider) {
     Chart.defaults.global.elements.line.fill = false
     Chart.defaults.global.colors = [ '#3E4EB8', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360']
     $locationProvider.html5Mode(true);
     $routeProvider.otherwise({
         redirectTo: '/'
     });
 }]);
$app.run(function($rootScope){
    $rootScope.socket = io()
    $rootScope.$on('$routeChangeStart', function(){
        $rootScope.socket.emit('set_app', '!@#$%^&*&T^^E%$ER$%$#%$')
    })
})
