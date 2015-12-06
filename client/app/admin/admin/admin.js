'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('admin', {
        parent: 'master-app-layout-frame',
        url: '/admin',
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/admin/admin.html',
            controller: 'AdminCtrl',
            controllerAs: 'AdminCtrl',
            authenticate: true,
          }
        }
      });
  });
