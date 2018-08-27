'use strict';
 angular.module('app')
 .factory('Review', function ($q) {

    var Review = Parse.Object.extend('Review', {

    }, {

      update: function (review) {

        var defer = $q.defer();

        review.save(null, {
          success: function (obj) {
            defer.resolve(obj);
          },
          error: function (obj, error) {
            defer.reject(error);
          }
        });

        return defer.promise;
      },

      destroy: function (obj) {

        var defer = $q.defer();

        obj.destroy({
          success: function (obj) {
            defer.resolve(obj);
          },
          error: function (obj, error) {
            defer.reject(error);
          }
        });

        return defer.promise;
      },

      count: function (params) {

        var defer = $q.defer();

        var query = new Parse.Query(this);

        query.count({
          success: function (count) {
            defer.resolve(count);
          },
          error: function (error) {
            defer.reject(error);
          }
        });

        return defer.promise;

      },

      all: function (params) {

        var defer = $q.defer();

        var query = new Parse.Query(this);

        query.descending('createdAt');
        query.include(['user', 'place']);
        query.limit(params.limit);
        query.skip((params.page * params.limit) - params.limit);
        query.find({
          success: function (reviews) {
            defer.resolve(reviews);
          },
          error: function (error) {
            defer.reject(error);
          }
        });

        return defer.promise;

      },

    });

    Object.defineProperty(Review.prototype, 'user', {
      get: function () {
        return this.get('user');
      }
    });

    Object.defineProperty(Review.prototype, 'place', {
      get: function () {
        return this.get('place');
      }
    });

    Object.defineProperty(Review.prototype, 'comment', {
      get: function () {
        return this.get('comment');
      }
    });

    Object.defineProperty(Review.prototype, 'rating', {
      get: function () {
        return this.get('rating');
      }
    });

    Object.defineProperty(Review.prototype, 'isInappropriate', {
      get: function () {
        return this.get('isInappropriate');
      },
      set: function (val) {
        this.set('isInappropriate', val);
      }
    });

    return Review;

});
