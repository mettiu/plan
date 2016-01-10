'use strict';

angular.module('planApp')
  .controller('NewUserCtrl', function ($log, $http, $timeout, $scope, $state, User, resolvedUserToEdit) {

    var vm = this;

    vm.getCompanies = getCompanies;
    vm.onCompanySelect = onCompanySelect;
    vm.refreshCompanies = refreshCompanies;
    vm.update = update;

    activate();

    ///////

    function activate() {
      vm.editStatus = true;
      vm.user = resolvedUserToEdit;
      if (vm.user && vm.user._company) {
        vm.company = angular.copy(vm.user._company);
        vm.user._company = vm.company._id;
      }
      vm.heading = 'Modifica User';
      if (!vm.user) {
        vm.editStatus = false;
        vm.user = new User();
        vm.company = null;
        vm.heading = 'Crea Nuovo User';
      }
      vm.companies = [];
    }

    function getCompanies(value) {
      return $http.get('/api/companies/find', {
        params: {
          field: 'name', //['name', '_id'],
          value: value
        }
      }).then(function(response) {
        return response.data.map(function(item) {
          return item.name;
        })
      })
    }

    function onCompanySelect(item) {
      vm.user._company = item._id;
    }

    function refreshCompanies(value) {
      //var params = {address: address, sensor: false};
      return $http.get('/api/companies/find', {
        params: {
          field: 'name', //['name', '_id'],
          value: value
        }
      }).then(function(response) {
        vm.companies = response.data;
      });
    };

    function update() {
      if (!vm.editStatus) {
        vm.user.$save(function () {
          $state.go('main');
        });
      } else {
        vm.user.$update(function () {
          $state.go('main');
        })
      }
    }

  });


// Resolvers


var EditUserResolver = /** @ngInject */ {
  resolvedUserToEdit: function ($log, $q, $http, $stateParams, User) {

    if (!$stateParams.userId) {
      // se non c'è il parametro, allora siamo nella pagina "new"
      return null;
    }
    var deferred = $q.defer();
    User.get({id: $stateParams.userId}, function (user) {
      //$log.info(user);
      deferred.resolve(user);
    })

    return deferred.promise;
  }
};
