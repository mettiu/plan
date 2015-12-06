'use strict';

angular.module('planApp')
  .controller('FeaturesCtrl', function ($log, $scope, $state, resolvedFeatureList, Feature) {
    var vm = this;

    vm.features = resolvedFeatureList;
    vm.deleteFeature = deleteFeature;
    vm.editFeature = editFeature;

    ///////

    function deleteFeature(feature) {

      feature = Feature.get({id: feature._id}, function () {
        feature.$delete(function () {
          $log.debug("Feature deleted");
          $state.forceReload();
        });
      });
    }

    function editFeature(feature) {
      $log.info("edit", feature);
      $state.go('frame.new-feature', {featureId: feature._id});
    }

  });


// Resolvers

var FeaturesResolver = /** @ngInject */ {
  resolvedFeatureList: function ($q, $http) {
    var deferred = $q.defer();
    $http.get('/api/features').success(function (features) {

      deferred.resolve(features);
    });
    return deferred.promise;
  }
};
