'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('new-feature', {
        parent: 'master-app-layout-frame',
        url: '/new-feature?featureId',
        authenticate: true,
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/new-feature/new-feature.html',
            controller: 'NewFeatureCtrl',
            controllerAs: 'NewFeatureCtrl',
            resolve: EditFeatureResolver
          }
        }
      });
  });
