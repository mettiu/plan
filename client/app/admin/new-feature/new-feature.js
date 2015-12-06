'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('frame.new-feature', {
        url: '/new-feature?featureId',
        views: {
          "main-content": {
            templateUrl: 'app/admin/new-feature/new-feature.html',
            controller: 'NewFeatureCtrl',
            controllerAs: 'NewFeatureCtrl',
            authenticate: true,
            resolve: EditFeatureResolver
          }
        }
      });
  });

