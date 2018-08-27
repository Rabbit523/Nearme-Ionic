angular.module('app')
  .controller('UserCtrl', function(User, $scope, $translate, $mdDialog, $mdToast, Auth) {

    // Pagination options.
    $scope.rowOptions = [10, 20, 40];

    $scope.query = {
      filter: '',
      limit: 40,
      page: 1,
      total: 0
    }

    $scope.users = [];

    var showToast = function (message) {
      $mdToast.show(
        $mdToast.simple()
        .content(message)
        .action('OK')
        .hideDelay(3000)
      );
    }

    Auth.ensureLoggedIn().then(function () {
      User.fetch().then(function (user) {
        $scope.loggedUser = user;
      })
    });

    var loadUsers = function() {
      Auth.ensureLoggedIn().then(function () {
        $scope.promise = User.all($scope.query).then(function (data) {
          $scope.users = data.users;
          $scope.query.total = data.total;
        });
      });
    }

    loadUsers();

   	$scope.onSearch = function () {
   		$scope.query.page = 1;
   		loadUsers();
   	}

   	$scope.onPaginationChange = function (page, limit) {
   		$scope.query.page = page;
   		$scope.query.limit = limit;
   		loadUsers();
   	}

    $scope.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
    }

    $scope.onSaveUser = function(ev) {

      $mdDialog.show({
          controller: 'DialogUserController',
          templateUrl: '/views/partials/user.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            user: null
          },
          clickOutsideToClose: true
        })
        .then(function (answer) {
          loadUsers();
        });
    }

    $scope.onUpdateUser = function(ev, user) {

      var objUser = angular.copy(user);

      $mdDialog.show({
          controller: 'DialogUserController',
          templateUrl: '/views/partials/user.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            user: objUser
          },
          clickOutsideToClose: true
        })
        .then(function (answer) {
          loadUsers();
        });
    };

    $scope.onDeleteUser = function (ev, user) {

      $translate(['DELETE', 'CONFIRM_DELETE', 'CONFIRM', 'CANCEL', 'DELETED']).then(function(str) {
        
        var confirm = $mdDialog.confirm()
          .title(str.DELETE)
          .textContent(str.CONFIRM_DELETE)
          .ariaLabel(str.DELETE)
          .ok(str.CONFIRM)
          .cancel(str.CANCEL);
        $mdDialog.show(confirm).then(function() {
  
  
          User.delete({ id: user.id }).then(function() {
            $translate('DELETED').then(function(str) {
                showToast(str);
            });
            loadUsers();
          }, function (error) {
            showToast(error.message);
          });
        });
  
      });
    };

  }).controller('DialogUserController',
    function(User, File, $scope, $translate, $mdDialog, $mdToast, user) {

    $scope.objUser = user || {};
    $scope.objUser.roleName = 'Admin';

    var showToast = function (message) {
      $mdToast.show(
        $mdToast.simple()
        .content(message)
        .action('OK')
        .hideDelay(3000)
      );
    };

    $scope.uploadImage = function(file) {

      if (file === null) {
        return;
      } else if (file.type.match(/image.*/) === null) {

        $translate('FILE_NOT_SUPPORTED').then(function(str) {
          showToast(str);
        });
        return;
      } else {

        $scope.isUploading = true;

        File.upload(file).then(function(savedFile) {
          $scope.objUser.photo = savedFile;
          $scope.isUploading = false;
        }, function(error) {

          showToast(error.message);
          $scope.isUploading = false;
        });
      }
    }

    $scope.onEventSaveUser = function(isValidForm) {

      if (isValidForm) {

        if (!$scope.objUser.password) {
          $translate('PASSWORD_REQUIRED').then(function(str) {
            showToast(str);
          });
        } else if ($scope.objUser.password.length < 6) {
          $translate('PASSWORD_AT_LEAST_SIX_CHARACTERS').then(function(str) {
            showToast(str);
          });
        } else {

          $scope.isSavingUser = true;

          User.create($scope.objUser).then(function(data) {
            $translate('SAVED').then(function(str) {
              showToast(str);
            });
            $mdDialog.hide();
            $scope.isSavingUser = false;
          }, function (error) {
            showToast(error.message);
            $scope.isSavingUser = false;
          });
        }
      } else {
        $translate('FILL_FIELDS').then(function(str) {
          showToast(str);
        });
      }
    }

    $scope.onEventUpdateUser = function (isValidForm) {

      if (isValidForm) {

        if ($scope.objUser.password && $scope.objUser.password.length < 6) {
          $translate('PASSWORD_AT_LEAST_SIX_CHARACTERS').then(function(str) {
            showToast(str);
          });
          return;
        }

        $scope.isSavingUser = true;

        User.update($scope.objUser).then(function(data) {
          $translate('SAVED').then(function(str) {
            showToast(str);
          });
            $mdDialog.hide();
            $scope.isSavingUser = false;
        }, function(error) {
          showToast(error.message);
          $scope.isSavingUser = false;
        });
      } else {
        $translate('FILL_FIELDS').then(function(str) {
          showToast(str);
        });
      }
    }

    $scope.hide = function() {
      $mdDialog.cancel();
    }

    $scope.cancel = function() {
      $mdDialog.cancel();
    }

  });
