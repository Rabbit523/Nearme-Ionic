angular.module('app')
    .controller('NotificationCtrl',
    function ($scope, $mdToast, Notification, File) {

        $scope.notification = Notification.new();

        var showSimpleToast = function (message) {
            $mdToast.show(
                $mdToast.simple()
                .content(message)
                .action('OK')
                .hideDelay(false)
            );
        };

        $scope.onSubmit = function (valid) {

            if (valid) {

                $scope.isSending = true;

                Notification.save($scope.notification).then(function () {
                    showSimpleToast('Notification sent');
                    $scope.notification = Notification.new();
                    $scope.isSending = false;
                    $scope.form.$setUntouched();
                    $scope.form.$setPristine();
                }, function (error) {
                    showSimpleToast('Error');
                    $scope.isSending = false;
                });

            } else {
                showSimpleToast('Please fill the required fields');
            }
        }

    });