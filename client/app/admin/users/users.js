'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('users', {
        parent: 'master-app-layout-frame',
        url: '/users',
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/users/users.html',
            controller: 'UsersCtrl',
            controllerAs: 'UsersCtrl',
            authenticate: true,
            resolve: UsersResolver
          }
        }
      });
  });
