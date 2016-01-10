'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('new-user', {
        parent: 'master-app-layout-frame',
        url: '/new-user?userId',
        authenticate: true,
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/new-user/new-user.html',
            controller: 'NewUserCtrl',
            controllerAs: 'NewUserCtrl',
            resolve: EditUserResolver
          }
        }
      });
  });

