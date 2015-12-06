'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('frame.users', {
        url: '/users',
        views: {
          "main-content": {
            templateUrl: 'app/admin/users/users.html',
            controller: 'UsersCtrl',
            controllerAs: 'UsersCtrl',
            authenticate: true,
            resolve: UsersResolver
          }
        }
      });
  });
