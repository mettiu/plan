'use strict';

angular.module('planApp')
  .controller('NewCompanyCtrl', function ($log, $scope, $state, Company, resolvedCompanyToEdit) {
    var vm = this;

    vm.editStatus = true;
    vm.company = resolvedCompanyToEdit;
    vm.heading = 'Modifica Company';
    if (!vm.company) {
      vm.editStatus = false;
      vm.company = new Company();
      vm.heading = 'Crea Nuova Compnay';
    }

    vm.update = update;

    ///////

    function update() {

      if (!vm.editStatus) {

        vm.company.$save(function () {
          $state.go('main');
        });
      } else {
        vm.company.$update(function () {
          $state.go('main');
        })
      }
    }


  });


// Resolvers

var EditCompanyResolver = /** @ngInject */ {
  resolvedCompanyToEdit: function ($log, $q, $http, $stateParams, Company) {

    if (!$stateParams.companyId) {
      // se non c'è il parametro, allora siamo nella pagina "new"
      return null;
    }
    var deferred = $q.defer();
    Company.get({id: $stateParams.companyId}, function (company) {
      deferred.resolve(company);
    })

    return deferred.promise;
  }
};
