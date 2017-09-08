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

 let $archive = angular.module('sa.archives.view', ['ngRoute']);
 $archive.config(['$routeProvider', function ($routeProvider) {
     $routeProvider.when('/view/:app/archives/:archive', {
         templateUrl: '/templates/archive.view.html',
         controller: 'ArchiveViewCtrl'
     });
 }]);

 $archive.controller("ArchiveViewCtrl", function ($scope, $timeout, $http, $routeParams, $interval, $rootScope) {
     $timeout(function(){
         componentHandler.upgradeAllRegistered();
     })
     $scope.app     = $routeParams.app
     $scope.file    = $routeParams.archive
     $scope.updateData  = function(){
         $timeout(function(){$scope.loading = true})
         $http.get("/archives/" + $scope.app + '/' + $scope.file).then(function(response) {
             $timeout(function(){
                 let data       = response.data
                 let time       = data.date
                 data           = data.data
                 let r          = {
                     'total': [[]],
                     'e': {

                     }
                 }
                let endpoints  = Object.keys(data)
                if(endpoints.length == 0)
                    return
                let len = data[endpoints[0]].views.length
                r.total[0] = Array.apply(null, Array(len)).map(Number.prototype.valueOf,0)
                for(let endpoint in data){
                    r.e[endpoint] = [[]]
                }
                let labels = []
                for(let i = 0;i < len;i++){
                    labels.push('')
                    for(let endpoint in data){
                        r.total[0][i] += data[endpoint].views[i]
                        r.e[endpoint][0].push(data[endpoint].views[i])
                    }
                }
                $timeout(function(){
                    console.log(r);
                    $scope.labels   = labels
                    $scope.data     = r
                    $scope.loading  = false
                    $scope.time     = time
                    endpoints.sort()
                    $scope.endpoints= endpoints
                })
             }, 500)
        });
     }
     $scope.updateData()

    $scope.series = [''];
    $scope.data = [[]];

    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
    $scope.options = {
        fillColor : "#ffff00",
      scales: {
        yAxes: [
          {
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'right',
            ticks: {
                // stepSize: 1,
                min: 0,
                autoSkip: false
            }
          }
      ],
      xAxes: [{
                display: false
            }]
    },
    maintainAspectRatio: false,
    animation : false,
    showTooltips: false,
    legend: {
            display: false
         },
         tooltips: {
            enabled: false
         }
    };

 });
