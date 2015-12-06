'use strict';

angular.module('planApp')
  .controller('UsersCtrl', function ($log, $scope, $state, resolvedUserList, User) {
    var vm = this;

    vm.users = resolvedUserList;
    vm.deleteUser = deleteUser;
    vm.editUser = editUser;

    ///////

    function deleteUser(user) {

      user = User.get({id: user._id}, function () {
        $log.info(user);
        user.$delete(function () {
          $log.debug("User deleted");
          $state.forceReload();
        });
      });
    }

    function editUser(user) {
      $state.go('frame.new-user', {userId: user._id});
    }

  });


// Resolvers

var UsersResolver = /** @ngInject */ {
  resolvedUserList: function ($log, $q, $http) {
    var deferred = $q.defer();
    $http.get('/api/users').success(function (users) {

      deferred.resolve(users);
    });
    return deferred.promise;
  }
};
