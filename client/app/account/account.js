'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('login', {
        parent: 'master-app-layout-frame',
        url: '/login',
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/account/login/login.html',
            controller: 'LoginCtrl'
          }
        }
      })
      .state('signup', {
        parent: 'master-app-layout-frame',
        url: '/signup',
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/account/signup/signup.html',
            controller: 'SignupCtrl'
          }
        }
      })
      .state('settings', {
        parent: 'master-app-layout-frame',
        url: '/settings',
        authenticate: true,
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/account/settings/settings.html',
            controller: 'SettingsCtrl'
          }
        }
      });
  });

