angular.module('app')
    .controller('PostCtrl', function (Post, $scope, $rootScope,
        $mdDialog, $mdToast, Auth) {

        $scope.posts = [];
        $scope.rowOptions = [5, 10, 25];
        $scope.query = {
            search: '',
            limit: 5,
            page: 1,
            total: 0,
            search: ''
        };

        var showSimpleToast = function (message) {
            $mdToast.show(
                $mdToast.simple()
                    .content(message)
                    .action('OK')
                    .hideDelay(false)
            );
        };


        $scope.onRefreshTable = function () {

            Auth.ensureLoggedIn().then(function () {
                $scope.promise = Post.all($scope.query).then(function (posts) {
                    $scope.posts = posts;
                });

            });
        };

        $scope.onCountTable = function () {

            Auth.ensureLoggedIn().then(function () {
                $scope.promise = Post.count($scope.query).then(function (total) {
                    $scope.query.total = total;
                });

            });
        }

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
                $scope.promise = Post.all($scope.query).then(function (posts) {
                    $scope.posts = posts;
                });
            });

        };

        $scope.onPaginationChange = function (page, limit) {
            $scope.query.page = page;
            $scope.query.limit = limit;
            $scope.onRefreshTable();
        };

        $scope.openMenu = function ($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

        $scope.onNewEditPost = function (event, obj) {

            $mdDialog.show({
                controller: 'DialogPostController',
                scope: $scope.$new(),
                templateUrl: '/views/partials/post.html',
                parent: angular.element(document.body),
                locals: {
                    "objPost": obj
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
                }, function () {
                    //'You cancelled the dialog.';
                });

        };

        $scope.onViewPost = function (event, obj) {

            $mdDialog.show({
                controller: 'DialogPostViewController',
                scope: $scope.$new(),
                templateUrl: '/views/partials/post.html',
                parent: angular.element(document.body),
                locals: {
                    "objPost": obj
                },
                clickOutsideToClose: false

            })
                .then(function (response) { }, function () {
                    //'You cancelled the dialog.';
                });
        };

        $scope.onDeletePost = function (post) {
            var confirm = $mdDialog.confirm()
                .title('Delete')
                .textContent('Are you sure you want to delete the post ?')
                .ariaLabel('Lucky day')
                .ok('Accept')
                .cancel('Reject');
            $mdDialog.show(confirm).then(function () {

                Post.delete(post).then(function () {
                    showSimpleToast('Deleted');
                    $scope.onRefreshTable();
                    $scope.onCountTable();
                }, function (error) {
                    console.log(error);
                });

            }, function () {
                //Cancel
            });
        };

    }).controller('DialogPostController', function (Post, File, Place, $scope, $mdDialog,
        $mdToast, objPost) {

        $scope.ActiveAction = true;
        $scope.ActiveActionVideo = true;
        $scope.typeAction = '';
        $scope.isSavingDisabled = false;
        $scope.imageFilename = '';
        $scope.videoFilename = '';

        if (Object.keys(objPost).length == 0) {
            $scope.typeAction = 'new';
            $scope.post = Post.new();
        } else {
            $scope.typeAction = 'edit';
            $scope.post = objPost;
            $scope.imageFilename = $scope.post.image == undefined ? null : $scope.post.image._name;
            $scope.videoFilename = $scope.post.video == undefined ? null : $scope.post.video._name;
        }

        $scope.queryPlaces = function (query) {
            var query = query || '';
            return Place.all({
                filter: query.toLowerCase(),
                status: 'Approved'
            });
        };

        var showSimpleToast = function (message) {
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
                showSimpleToast('File not supported');
                return;
            } else {

                $scope.imageFilename = file.name;
                $scope.isUploading = true;

                File.upload(file).then(function (savedFile) {
                    var getImg = savedFile._source.file;
                    $scope.post.image = new Parse.File(getImg.name, getImg);
                    $scope.isUploading = false;
                    showSimpleToast('File uploaded');
                }, function (error) {

                    showSimpleToast(error.message);
                    $scope.isUploading = false;
                    $scope.post.image = {};

                });
            }
        };

        $scope.uploadVideo = function (file) {

            if (file === null || file.type.match(/video.*/) === null) {
                showSimpleToast('File not supported');
                return;
            } else {

                $scope.videoFilename = file.name;
                $scope.isUploadingVideo = true;

                File.upload(file).then(function (savedFile) {
                    var getImg = savedFile._source.file;
                    $scope.post.video = new Parse.File(getImg.name, getImg);
                    $scope.isUploadingVideo = false;
                    showSimpleToast('File uploaded');
                }, function (error) {

                    showSimpleToast(error.message);
                    $scope.isUploadingVideo = false;
                    $scope.post.video = {};

                });
            }
        };

        $scope.onSubmit = function (valid) {

            $scope.isSavingDisabled = true;

            if (valid) {

                $scope.post.canonical = $scope.setCanonical($scope.post);

                Post.save($scope.post).then(function () {
                    $scope.isSavingDisabled = false;
                    $mdDialog.hide({
                        'estatus': 'success'
                    });
                    showSimpleToast('Saved');
                }, function (error) {
                    $scope.isSavingDisabled = false;
                });

            } else {
                $scope.isSavingDisabled = false;
                showSimpleToast('Complete all form fields');
            }

        };

        $scope.setCanonical = function (objPost) {
            var canonical = angular.lowercase(objPost.title);
            return canonical;
        };

    }).controller('DialogPostViewController', function (Post, File, $scope, $mdDialog,
        $mdToast, objPost) {

        $scope.ActiveAction = false;
        $scope.typeAction = 'view';
        $scope.post = objPost;
        $scope.imageFilename = $scope.post.image == undefined ? null : $scope.post.image._name;
        $scope.videoFilename = $scope.post.video == undefined ? null : $scope.post.video._name;

        $scope.onCancel = function () {
            $mdDialog.cancel();
        };

    });