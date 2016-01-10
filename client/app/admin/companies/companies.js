'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('companies', {
        parent: 'master-app-layout-frame',
        url: '/companies',
        authenticate: true,
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/companies/companies.html',
            controller: 'CompaniesCtrl',
            controllerAs: 'CompaniesCtrl',
            resolve: CompaniesResolver
          }
        }
      });
  });
