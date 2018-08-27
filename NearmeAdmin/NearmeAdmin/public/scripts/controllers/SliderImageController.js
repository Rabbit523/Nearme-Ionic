angular.module('app')
    .controller('SliderImageCtrl', function (SliderImage, $scope,
        $rootScope, $mdDialog, $mdToast, Auth) {

        $scope.rowOptions = [5, 10, 25];
        $scope.sliderImages = [];

        $scope.query = {
            search: '',
            limit: 5,
            page: 1,
            total: 0,
            search: ''
        };

        var showToast = function (message) {
            $mdToast.show(
                $mdToast.simple()
                .content(message)
                .action('OK')
                .hideDelay(false)
            );
        };

        $scope.onRefreshTable = function () {

            Auth.ensureLoggedIn().then(function () {
                $scope.promise = SliderImage.all($scope.query).then(function (slider) {
                    $scope.sliderImages = slider;
                });

            });
        };

        $scope.onCountTable = function () {

            Auth.ensureLoggedIn().then(function () {
                $scope.promise = SliderImage.count($scope.query).then(function (total) {
                    $scope.query.total = total;
                });

            });
        };

        $scope.onRefreshTable();
        $scope.onCountTable();

        $scope.onReload = function () {
            $scope.query.page = 1;
            $scope.onRefreshTable();
            $scope.onCountTable();
        };

        $scope.logOrder = function (order) {

            var getOrder = order.indexOf("-");
            var gerTable = getOrder == -1 ? order : order.slice(1, order.length);
            $scope.query.orderby = getOrder == -1 ? "asc" : "desc";
            $scope.query.orderbytable = gerTable;

            Auth.ensureLoggedIn().then(function () {
                $scope.promise = SliderImage.all($scope.query).then(function (sliders) {
                    $scope.sliderImages = sliders;
                });
            });

        };

        $scope.onPaginationChange = function (page, limit) {
            $scope.query.page = page;
            $scope.query.limit = limit;
            $scope.onRefreshTable();
        };

        $scope.onNewEditSlider = function (event, obj) {
            $mdDialog.show({
                    controller: 'DialogSliderController',
                    scope: $scope.$new(),
                    templateUrl: '/views/partials/slider-image.html',
                    parent: angular.element(document.body),
                    locals: {
                        objSlider: obj
                    },
                    clickOutsideToClose: false

                })
                .then(function (response) {
                    if (response != undefined) {
                        if (response.estatus == "success") {
                            $scope.onRefreshTable();
                            $scope.onCountTable();
                        }
                    }
                });
        };

        $scope.onChangeStatus = function (slider, status) {
            slider.isActive = status;
            SliderImage.save(slider).then(function (data) {
                showToast('Saved');
                $scope.onRefreshTable();
                $scope.onCountTable();
            }, function (error) {
                showToast('Error');
            });
        };

        $scope.onDelete = function (slider) {

            var confirm = $mdDialog.confirm()
                .title('Delete')
                .textContent('Are you sure you want to delete this record?')
                .ariaLabel('Delete Slider Image')
                .ok('Confirm')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function () {

                SliderImage.delete(slider).then(function () {
                    showToast('Deleted');
                    $scope.onRefreshTable();
                    $scope.onCountTable();
                }, function (error) {
                    showToast('Error');
                });
            });
        };

        $scope.openMenu = function ($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

    }).controller('DialogSliderController', function (SliderImage, Place, File, $scope, $mdDialog,
        $mdToast, objSlider) {

        $scope.slider = objSlider || SliderImage.new();

        $scope.queryPlaces = function (query) {
            var query = query || '';
            return Place.all({ filter: query.toLowerCase(), status: 'Approved' });
        }

        var showToast = function (message) {
            $mdToast.show(
                $mdToast.simple()
                .content(message)
                .action('OK')
                .hideDelay(false)
            );
        };

        $scope.onCancel = function () {
            $mdDialog.cancel();
        };

        $scope.uploadImage = function (file) {

            if (file === null || file.type.match(/image.*/) === null) {
              showToast('File not supported');
            } else {

                $scope.isUploading = true;

                File.upload(file).then(function (savedFile) {
                    $scope.slider.image = savedFile;
                    $scope.isUploading = false;
                    showToast('File uploaded');
                }, function (error) {
                    showToast(error.message);
                    $scope.isUploading = false;
                });
            }
        }

        $scope.onSubmit = function (valid) {

            if (valid) {

                if (!$scope.slider.image) {
                    return showToast('Please choose an image');
                }

                $scope.isSavingDisabled = true;

                SliderImage.save($scope.slider).then(function () {
                    $scope.isSavingDisabled = false;
                    $mdDialog.hide({
                        'estatus': 'success'
                    });
                    showToast('Saved');
                }, function (error) {
                    $scope.isSavingDisabled = false;
                    showToast('Error');
                });

            } else {
                $scope.isSavingDisabled = false;
                showToast('Please fill the required fields');
            }

        };

    }).controller('DialogSliderViewController', function (SliderImage, $scope, $mdDialog,
        $mdToast, objSlider) {

        $scope.slider = objSlider;

        $scope.onCancel = function () {
            $mdDialog.cancel();
        };

    });