'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('frame.companies', {
        url: '/companies',
        views: {
          "main-content": {
            templateUrl: 'app/admin/companies/companies.html',
            controller: 'CompaniesCtrl',
            controllerAs: 'CompaniesCtrl',
            authenticate: true,
            resolve: CompaniesResolver
          }
        }
      });
  });
