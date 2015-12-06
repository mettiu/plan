'use strict';

describe('Controller: CompaniesCtrl', function () {

  // load the controller's module
  beforeEach(module('planApp'));

  var CompaniesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CompaniesCtrl = $controller('CompaniesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
