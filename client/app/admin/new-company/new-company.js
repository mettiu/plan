'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('new-company', {
        parent: 'master-app-layout-frame',
        url: '/new-company',
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/new-company/new-company.html',
            controller: 'NewCompanyCtrl',
            controllerAs: 'NewCompanyCtrl',
            authenticate: true,
            resolve: EditCompanyResolver
          }
        }
      });
  });
