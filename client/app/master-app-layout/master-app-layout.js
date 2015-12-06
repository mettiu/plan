/**
 * Created by matteo on 06/12/2015.
 */

'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('master-app-layout', {
        templateUrl: 'app/master-app-layout/master-app-layout.html'
      })

      // serve per non ripetere la navbar in ogni view
      .state('master-app-layout-frame', {
        parent: 'master-app-layout',
        abstract: true,
        views: {
          "navbar": {
            controller: 'NavbarCtrl',
            controllerAs: 'NavbarCtrl',
            templateUrl: 'app/master-app-layout/navbar/navbar.html'
          }
        }
      });
  });
