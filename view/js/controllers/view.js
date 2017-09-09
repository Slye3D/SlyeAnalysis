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

 let $view = angular.module('sa.view', ['ngRoute']);
 $view.config(['$routeProvider', function ($routeProvider) {
     $routeProvider.when('/view/:app', {
         templateUrl: '/templates/view.html',
         controller: 'ViewCtrl'
     });
 }]);

 $view.controller("ViewCtrl", function ($scope, $timeout, $http, $routeParams, $interval, $rootScope) {
     $timeout(function(){
         componentHandler.upgradeAllRegistered();
     })
     $scope.app = $routeParams.app
     console.log($routeParams.app);

    $scope.labels = [];
    $scope.series = [''];
    $scope.data = [
      []
    ];
    let t = 2 * 60
    let lastNSec = t
    for(let i = 0;i < t + 1;i++){
        $scope.labels.push('')
    }

    let data    = {
        // 'endpoint': {
        //     'time': 'count'
        // }
    }

    $scope.data         = {}
    $scope.endpoints    = []
    $scope.total        = []

    function data2ChartData(){
        let time            = parseInt(Date.now() / 1000)
        let endpoints       = Object.keys(data)
        let total           = []
        endpoints.sort()
        let d  = {
            ':total': [[]],
            'e': {}
        }
        for(let i = 0;i < endpoints.length;i++){
            d['e'][endpoints[i]] = [[]]
            total.push(0)
        }
        total.push(0)
        let e = total.length - 1
        // i = time - n
        // i is timestamp
        // loop for last n seconds
        for(let i = time - lastNSec,j=0;i < time + 1;i++,j++){
            d[':total'][0].push(0)
            for(let epi = 0;epi < endpoints.length;epi++){
                let endpoint = endpoints[epi]
                let v = data[endpoint][i] || 0
                d[':total'][0][j] += v
                d['e'][endpoint][0].push(v)
                // console.log(epi, endpoint);
                total[epi] += v
                total[e] += v
            }
        }
        $timeout(function(){
            $scope.data         = d
            $scope.endpoints    = endpoints
            $scope.total        = total
            let i = -1
            $scope.polarData= Array.apply(null, Array(endpoints.length)).map(function(){
                i++
                return total[i]
            })
            $scope.polarType= 'polarArea'
            $scope.togglePolar = function () {
                $scope.polarType = $scope.polarType === 'polarArea' ?
                'pie' : 'polarArea';
            }
        })
    }
    $interval(data2ChartData, 1000)

    $rootScope.socket.emit('set_app', $scope.app)
    $rootScope.socket.on('views-' + $scope.app, function(view){
        let {time, value, endpoint} = view
        if(!data[endpoint])
            data[endpoint]  = {}
        data[endpoint][time] = parseInt(value)
        data2ChartData()
    })

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
            },
            scaleLabel: {
                display: true,
                labelString: 'Req/S'
            }
          }
      ],
      xAxes: [{
                display: false
            }]
    },
    elements: {
        point:{
            radius: 0
        }
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
