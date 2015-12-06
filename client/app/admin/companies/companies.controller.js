'use strict';

angular.module('planApp')
  .controller('CompaniesCtrl', function ($log, $scope, $state, resolvedCompanyList, Company) {
    var vm = this;

    vm.companies = resolvedCompanyList;
    vm.deleteCompany = deleteCompany;
    vm.editCompany = editCompany;

    ///////

    function deleteCompany(company) {

      company = Company.get({id: company._id}, function () {
        company.$delete(function () {
          $log.debug("Company deleted");
          $state.forceReload();
        });
      });
    }

    function editCompany(company) {
      $state.go('frame.new-company', {companyId: company._id});
    }

  });


// Resolvers

var CompaniesResolver = /** @ngInject */ {
  resolvedCompanyList: function ($q, $http) {
    var deferred = $q.defer();
    $http.get('/api/companies').success(function (companies) {

      deferred.resolve(companies);
    });
    return deferred.promise;
  }
};
