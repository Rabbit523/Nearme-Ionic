'use strict';

 angular.module('app')
 .controller('PlaceCtrl',
 function ($scope, $mdDialog, $mdToast, $translate, Place, Category, Auth) {

 	// Pagination options
 	$scope.rowOptions = [10, 20, 40];

  $scope.query = {
 		filter: '',
 		limit: 40,
 		page: 1,
    total: 0,
    isFeatured: null,
    status: null,
    category: null,
    date: null
 	};

 	$scope.places = [];

 	var showSimpleToast = function (message) {
 	  $mdToast.show(
 	    $mdToast.simple()
 		  .content(message)
 		  .action('OK')
 		  .hideDelay(3000)
 	  );
 	};

 	var loadPlaces = function () {
    Auth.ensureLoggedIn().then(function () {
 		  $scope.promise = Place.all($scope.query).then(function (places) {
 			  $scope.places = places;
 		  });
    });
 	};

 	loadPlaces();

  var loadCount = function () {
    Auth.ensureLoggedIn().then(function () {
      Place.count($scope.query).then(function (total) {
   		  $scope.query.total = total;
   	  });
    });
  }

  loadCount();

  var loadCategories = function () {
    var params = {
      page: 1, limit: 1000, filter: '', order: 'title'
    }

    Auth.ensureLoggedIn().then(function () {
      Category.all(params).then(function (categories) {
        $scope.categories = categories;
      });
    });
  }

  loadCategories();

  $scope.onQueryChange = function () {
    $scope.query.page = 1;
 		$scope.query.total = 0;
 		loadPlaces();
    loadCount();
  }

 	$scope.onCreatePlace = function (ev) {

 		$mdDialog.show({
 			controller: 'DialogPlaceController',
 			templateUrl: '/views/partials/place.html',
 			parent: angular.element(document.body),
 			targetEvent: ev,
 			locals: {
 				place: null
 			},
 			clickOutsideToClose: true
 		})
 		.then(function (answer) {
 			loadPlaces();
      loadCount();
 		});
 	};

 	$scope.onPaginationChange = function (page, limit) {
 		$scope.query.page = page;
 		$scope.query.limit = limit;
 		loadPlaces();
 	};

 	$scope.openMenu = function ($mdOpenMenu, ev) {
 		$mdOpenMenu(ev);
 	};

  $scope.isDate = function (date) {
    return angular.isDate(date);
  }

  $scope.onUpdateExpiresAt = function (ev, place) {

    $mdDialog.show({
      controller: 'DialogPlaceExpiresAtController',
      templateUrl: '/views/partials/expiration-modal.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      locals: {
        place: place
      }
    });

  }

 	$scope.onUpdatePlace = function (ev, place) {

    var objPlace = angular.copy(place);

 		$mdDialog.show({
 		  controller: 'DialogPlaceController',
 		  templateUrl: '/views/partials/place.html',
 		  parent: angular.element(document.body),
	    targetEvent: ev,
	    locals: {
        place: objPlace
      },
 		  clickOutsideToClose: true
 		});
 	};

 	$scope.onDestroyPlace = function (ev, place) {

    $translate(['DELETE', 'CONFIRM_DELETE', 'CONFIRM', 'CANCEL', 'DELETED']).then(function(str) {
			
			var confirm = $mdDialog.confirm()
				.title(str.DELETE)
				.textContent(str.CONFIRM_DELETE)
				.ariaLabel(str.DELETE)
				.ok(str.CONFIRM)
				.cancel(str.CANCEL);
			$mdDialog.show(confirm).then(function() {


				Place.destroy(place).then(function() {
					$translate('DELETED').then(function(str) {
							showSimpleToast(str);
					});
					loadPlaces();
				  loadCount();
				}, function (error) {
					showSimpleToast(error.message);
				});
			});

		});
 	};

  $scope.onChangeStatus = function (place, status) {

    place.status = status;
    place.unset('expiresAt');

    Place.update(place).then(function () {
      $translate('SAVED').then(function(str) {
        showSimpleToast(str);
      });
    }, function (error) {
      showSimpleToast('Error');
    });

  };

 }).controller('DialogPlaceController', function(
 	$scope, $mdDialog, $mdToast, $translate, Place, Category, File, NgMap, GeoCoder, place) {

   var marker, map;
   
  $scope.placeFromGooglePlaces = null;

  $scope.autocompleteOptions = {
  }

  $scope.$watch(function (scope) {
    return scope.placeFromGooglePlaces;
  }, function (newValue, oldValue) {

    if (newValue) {
      $scope.place.title     = $scope.placeFromGooglePlaces.name;
      $scope.place.address   = $scope.placeFromGooglePlaces.formatted_address;
      $scope.place.website   = $scope.placeFromGooglePlaces.website;
      $scope.place.phone     = $scope.placeFromGooglePlaces.formatted_phone_number;
      $scope.input = {
        latitude: $scope.placeFromGooglePlaces.geometry.location.lat(),
        longitude: $scope.placeFromGooglePlaces.geometry.location.lng()
      };

      $scope.onInputLocationChanged();
    }
  });

 	$scope.categories = [];
 	$scope.place = {};
  $scope.place.category = null;
  $scope.place.website = '';
 	$scope.imageOneFilename = '';
 	$scope.imageTwoFilename = '';
 	$scope.imageThreeFilename = '';
 	$scope.imageFourFilename = '';
  $scope.input = {};

 	$scope.isCreating = true;
  $scope.isImageOneUploading = false;
  $scope.isImageTwoUploading = false;
  $scope.isImageThreeUploading = false;
  $scope.isImageFourUploading = false;

 	if (place) {

 		$scope.place = place;
    if ($scope.place.image) {
      $scope.imageOneFilename = $scope.place.image.name();
    }

    if ($scope.place.imageTwo) {
      $scope.imageTwoFilename = $scope.place.imageTwo.name();
    }

    if ($scope.place.imageThree) {
      $scope.imageThreeFilename = $scope.place.imageThree.name();
    }

    if ($scope.place.imageFour) {
      $scope.imageFourFilename = $scope.place.imageFour.name();
    }

    $scope.input.latitude = place.location.latitude;
    $scope.input.longitude = place.location.longitude;

 		$scope.isCreating = false;
 	}

 	Category.all({ page: 1, limit: 1000, filter: '' })
  .then(function (categories) {
    $scope.categories = categories;
  });

 	var showSimpleToast = function (message) {
 		$mdToast.show(
 			$mdToast.simple()
 			.content(message)
 			.action('OK')
 			.hideDelay(3000)
 		);
 	};

  $scope.onAddressChanged = function () {
    GeoCoder.geocode({ address: $scope.place.address }).then(function (result) {

      if (map) {

        var location = result[0].geometry.location;
        location = new google.maps.LatLng(location.lat(), location.lng());

        map.setCenter(location);
        map.setZoom(15);

        marker.setPosition(location);

        $scope.place.location = new Parse.GeoPoint({
          latitude: location.lat(),
          longitude: location.lng()
        });

        $scope.input.latitude = location.lat();
        $scope.input.longitude = location.lng();
      }
    });
  }

  NgMap.getMap().then(function (objMap) {

    map = objMap;
    marker = map.markers[0];

    // Fix gray area in second render
    google.maps.event.trigger(map,'resize');

    if (place) {

      var placeLocation = new google.maps.LatLng(
        place.location.latitude,
        place.location.longitude);

      map.setCenter(placeLocation)
      marker.setPosition(placeLocation);
      map.setZoom(15);
    } else {
      map.setZoom(1);
      map.setCenter(new google.maps.LatLng(0, 0));
    }
  });


  $scope.onMarkerDragEnd = function (ev) {

    var lat = ev.latLng.lat();
    var lng = ev.latLng.lng();

    $scope.place.location = new Parse.GeoPoint({
      latitude: lat,
      longitude: lng
    });

    $scope.input.latitude = lat;
    $scope.input.longitude = lng;
  };

  $scope.onInputLocationChanged = function () {

    if ($scope.input.latitude && $scope.input.longitude && map) {

      $scope.place.location = new Parse.GeoPoint({
        latitude: $scope.input.latitude,
        longitude: $scope.input.longitude
      });

      marker.setPosition(new google.maps.LatLng(
        $scope.input.latitude,
        $scope.input.longitude
      ));

      map.setCenter(new google.maps.LatLng(
        $scope.input.latitude,
        $scope.input.longitude
      ));

      map.setZoom(12);
    }
  }

 	$scope.uploadImageOne = function (file, invalidFile) {

    if (file) {

      $scope.isImageOneUploading = true;
      $scope.imageOneFilename = file.name;

 		  File.upload(file).then(function (savedFile) {

        $scope.place.image = savedFile;
        $scope.isImageOneUploading = false;
 		  },
      function (error) {
        $scope.isImageOneUploading = false;
        showSimpleToast(error.message);
 		  });

    } else {
      if (invalidFile) {
        if (invalidFile.$error === 'maxSize') {
          showSimpleToast('Image too big. Max ' + invalidFile.$errorParam);
        }
      }
    }
 	};

  $scope.uploadImageTwo = function (file, invalidFile) {

    if (file) {

      $scope.isImageTwoUploading = true;
      $scope.imageTwoFilename = file.name;

 		  File.upload(file).then(function (savedFile) {

        $scope.place.imageTwo = savedFile;
        $scope.isImageTwoUploading = false;
 		  },
      function (error) {
        $scope.isImageTwoUploading = false;
        showSimpleToast(error.message);
 		  });

    } else {
      if (invalidFile) {
        if (invalidFile.$error === 'maxSize') {
          showSimpleToast('Image too big. Max ' + invalidFile.$errorParam);
        }
      }
    }
 	}

  $scope.uploadImageThree = function (file, invalidFile) {

    if (file) {

      $scope.isImageThreeUploading = true;
      $scope.imageThreeFilename = file.name;

 		  File.upload(file).then(function (savedFile) {

        $scope.place.imageThree = savedFile;
        $scope.isImageThreeUploading = false;
 		  },
      function (error) {
        $scope.isImageThreeUploading = false;
        showSimpleToast(error.message);
 		  });
 	  } else {
      if (invalidFile) {
        if (invalidFile.$error === 'maxSize') {
          showSimpleToast('Image too big. Max ' + invalidFile.$errorParam);
        }
      }
    }
 	}

  $scope.uploadImageFour = function (file, invalidFile) {

    if (file) {

      $scope.isImageFourUploading = true;
      $scope.imageFourFilename = file.name;

 		  File.upload(file).then(function (savedFile) {

        $scope.place.imageFour = savedFile;
        $scope.isImageFourUploading = false;
 		  },
      function (error) {
        $scope.isImageFourUploading = false;
        showSimpleToast(error.message);
 		  });
 	  } else {
      if (invalidFile) {
        if (invalidFile.$error === 'maxSize') {
          showSimpleToast('Image too big. Max ' + invalidFile.$errorParam);
        }
      }
    }
 	}

 	$scope.hide = function() {
 	  $mdDialog.cancel();
 	};

 	$scope.cancel = function() {
 	  $mdDialog.cancel();
 	};

 	$scope.onSavePlace = function (isFormValid) {

 		if (!isFormValid) {
      $translate('FILL_FIELDS').then(function(str) {
        showSimpleToast(str);
      });
 		}  else if (!$scope.place.location) {
      $translate('LOCATION_REQUIRED').then(function(str) {
        showSimpleToast(str);
      });
 		}
 		else {

      $scope.isSavingPlace = true;

      $scope.place.isApproved = true;

 			Place.create($scope.place).then(function (place) {
        $translate('SAVED').then(function(str) {
          showSimpleToast(str);
        });
 				$mdDialog.hide();
        $scope.isSavingPlace = false;
 			},
 			function (error) {
 				showSimpleToast(error.message);
        $scope.isSavingPlace = false;
 			});
 		}
 	};

 	$scope.onUpdatePlace = function (isFormValid) {

 		if(!isFormValid) {
      $translate('FILL_FIELDS').then(function(str) {
        showSimpleToast(str);
      });
 		} else {

      $scope.isSavingPlace = true;

 			Place.update($scope.place).then(function (place) {
        $translate('SAVED').then(function(str) {
          showSimpleToast(str);
        });
 				$mdDialog.hide();
        $scope.isSavingPlace = false;
 			},
 			function (error) {
 				showSimpleToast(error.message);
        $scope.isSavingPlace = false;
 			});

 		}
 	};

}).controller('DialogPlaceExpiresAtController',
function($scope, $mdDialog, $mdToast, $translate, Place, place) {

  $scope.place = place;
  $scope.formData = {};

  var showToast = function (message) {
 		$mdToast.show(
 			$mdToast.simple()
 			.content(message)
 			.action('OK')
 			.hideDelay(3000)
 		);
 	};

  $scope.isDayInvalid = function () {
    var days = $scope.formData.days;

    if (days) {
      days = parseInt(days, 10);
      return days < 1;
    }
    return true;
  }

  $scope.onUpdateExpiresAt = function () {

    var expiresAt = moment().add($scope.formData.days, 'days').startOf('day').toDate()
    place.expiresAt = expiresAt;
    place.status = 'Approved';

    $scope.isSavingExpiresAt = true;

    Place.update(place).then(function () {
      $scope.isSavingExpiresAt = false;
      $translate('SAVED').then(function(str) {
        showToast(str);
      });
      $scope.hide();
    },
    function (error) {
      $scope.isSavingExpiresAt = false;
      showToast('Error');
    });
  }

  $scope.hide = function() {
    $mdDialog.hide();
  };

}).directive('numbersOnly', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ngModelCtrl) {
      function fromUser(text) {
        if (text) {
          var transformedInput = text.replace(/[^0-9]/g, '');

          if (transformedInput !== text) {
            ngModelCtrl.$setViewValue(transformedInput);
            ngModelCtrl.$render();
          }
          return transformedInput;
        }
        return undefined;
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  };
});
