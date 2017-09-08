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
     console.log(Chart.defaults.global);
     Chart.defaults.global.elements.line.tension = 0.000000001
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

// https://gist.github.com/oitozero/575b3a66c7032d18f059
$app.filter("nrFormat", function() {
  return function(number) {
    var abs;
    if (number !== void 0) {
      abs = Math.abs(number);
      if (abs >= Math.pow(10, 12)) {
        number = (number / Math.pow(10, 12)).toFixed(1) + "t";
      } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
        number = (number / Math.pow(10, 9)).toFixed(1) + "b";
      } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
        number = (number / Math.pow(10, 6)).toFixed(1) + "m";
      } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
        number = (number / Math.pow(10, 3)).toFixed(1) + "k";
      }
      return number;
    }
  };
});
