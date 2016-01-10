'use strict';

angular.module('planApp')
  .controller('MainCtrl', function ($log, $scope, $http, resolvedFeatureList) {

    var vm = this;
    vm.features = resolvedFeatureList;

    activate();

    ///////////

    function activate() {
    }

    //$scope.awesomeThings = [];
    //
    //$http.get('/api/things').success(function (awesomeThings) {
    //  $scope.awesomeThings = awesomeThings;
    //});
    //
    //$scope.addThing = function () {
    //  if ($scope.newThing === '') {
    //    return;
    //  }
    //  $http.post('/api/things', {name: $scope.newThing});
    //  $scope.newThing = '';
    //};
    //
    //$scope.deleteThing = function (thing) {
    //  $http.delete('/api/things/' + thing._id);
    //};


  });

// Resolvers

var MainResolver = /** @ngInject */ {
  resolvedFeatureList: function ($q, $http) {
    var deferred = $q.defer();
    $http.get('/api/features').success(function (features) {

      deferred.resolve(features);
    });
    return deferred.promise;
  }
};
