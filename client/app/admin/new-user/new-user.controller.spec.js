'use strict';

describe('Controller: NewUserCtrl', function () {

  // load the controller's module
  beforeEach(module('planApp'));

  var NewUserCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    NewUserCtrl = $controller('NewUserCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
