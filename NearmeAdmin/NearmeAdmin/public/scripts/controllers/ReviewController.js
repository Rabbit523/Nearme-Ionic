'use strict';

 angular.module('app')
 .controller('ReviewCtrl', function ($scope, $translate, $mdToast, $mdDialog, Review, Auth) {

 	// Pagination options.
 	$scope.rowOptions = [10, 20, 40];

 	$scope.query = {
 		limit: 40,
 		page: 1,
 		total: 0,
    status: null
 	};

 	$scope.reviews = [];

 	var loadReviews = function() {
    Auth.ensureLoggedIn().then(function () {
 		  $scope.promise = Review.all($scope.query).then(function (reviews) {
 			  $scope.reviews = reviews;
 		  });
    });
 	}

 	loadReviews();

  var loadCount = function () {
    Auth.ensureLoggedIn().then(function () {
      Review.count($scope.query).then(function (total) {
   		  $scope.query.total = total;
   	  });
    });
  }

  loadCount();

  var showToast = function (message) {
 	  $mdToast.show(
 	    $mdToast.simple()
 		  .content(message)
 		  .action('OK')
 		  .hideDelay(3000)
 	  );
 	};

  $scope.onQueryChange = function () {
    $scope.query.page = 1;
 		loadReviews();
    loadCount();
  }

 	$scope.onPaginationChange = function (page, limit) {
 		$scope.query.page = page;
 		$scope.query.limit = limit;
 		loadReviews();
   };
   
   $scope.onDelete = function (ev, review) {

    $translate(['DELETE', 'CONFIRM_DELETE', 'CONFIRM', 'CANCEL', 'DELETED']).then(function(str) {
			
			var confirm = $mdDialog.confirm()
				.title(str.DELETE)
				.textContent(str.CONFIRM_DELETE)
				.ariaLabel(str.DELETE)
				.ok(str.CONFIRM)
				.cancel(str.CANCEL);
			$mdDialog.show(confirm).then(function() {


				Review.destroy(review).then(function() {
					$translate('DELETED').then(function(str) {
						showToast(str);
					});
					loadReviews();
				  loadCount();
				}, function (error) {
					showToast(error.message);
				});
			});

		});
 	};

  $scope.onUpdateIsInappropriate = function (review, value) {

    var objReview = angular.copy(review);

    objReview.isInappropriate = value;

    Review.update(objReview).then(function (success) {
      $translate('SAVED').then(function(str) {
        showToast(str);
      });
      }, function (error) {
      showToast('Error');
    });
  };

 	$scope.openMenu = function ($mdOpenMenu, ev) {
 		$mdOpenMenu(ev);
 	};
}).directive('starRating', function () {

  return {
    restrict: 'EA',
    template:
      '<ul class="star-rating" ng-class="{readonly: readonly}">' +
      '  <li ng-repeat="star in stars" class="star" ng-class="{filled: star.filled}" ng-click="toggle($index)">' +
      '    <i class="fa fa-star">&#9733</i>' + // or &#9733
      '  </li>' +
      '</ul>',
    scope: {
      ratingValue: '=ngModel',
      max: '=?', // optional (default is 5)
      onRatingSelect: '&?',
      readonly: '=?'
    },
    link: function(scope, element, attributes) {
      if (scope.max == undefined) {
        scope.max = 5;
      }
      function updateStars() {
        scope.stars = [];
        for (var i = 0; i < scope.max; i++) {
          scope.stars.push({
            filled: i < scope.ratingValue
          });
        }
      };
      scope.toggle = function(index) {
        if (scope.readonly == undefined || scope.readonly === false){
          scope.ratingValue = index + 1;
          scope.onRatingSelect({
            rating: index + 1
          });
        }
      };
      scope.$watch('ratingValue', function(oldValue, newValue) {
        if (newValue) {
          updateStars();
        }
      });
    }
  };
});
