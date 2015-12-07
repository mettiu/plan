'use strict';

angular.module('planApp')
  .controller('NewFeatureCtrl', function ($log, $scope, $state, Feature, resolvedFeatureToEdit) {
    var vm = this;

    vm.editStatus = true;
    vm.feature = resolvedFeatureToEdit;
    vm.heading = 'Modifica Feature';
    if (!vm.feature) {
      vm.editStatus = false;
      vm.feature = new Feature();
      vm.heading = 'Crea Nuova Feature';
    }

    vm.update = update;

    ///////

    function update() {
      if (!vm.editStatus) {
        vm.feature.$save(function () {
          $state.go('main');
        });
      } else {
        vm.feature.$update(function () {
          $state.go('main');
        })
      }
    }


  });


// Resolvers

var EditFeatureResolver = /** @ngInject */ {
  resolvedFeatureToEdit: function ($log, $q, $http, $stateParams, Feature) {

    //$log.info("s", $stateParams);
    if (!$stateParams.featureId) {
      // se non c'è il parametro, allora siamo nella pagina "new"
      return null;
    }
    var deferred = $q.defer();
    Feature.get({id: $stateParams.featureId}, function (feature) {
      deferred.resolve(feature);
    })

    //$http.get('/api/features/' + $stateParams.featureId).success(function (feature) {
    //
    //  deferred.resolve(feature);
    //});
    return deferred.promise;
  }
};
