angular.module('app').factory('SliderImage', function ($q) {

    var SliderImage = Parse.Object.extend('SliderImage', {

    }, {

        new() {
            return new SliderImage;
        },

        all: function (params) {

            var defer = $q.defer();
            var query = new Parse.Query(this);

            if (params && params.limit && params.page) {
                query.limit(params.limit);
                query.skip((params.page * params.limit) - params.limit);
            }

            query.include('place');
            query.ascending('sort');

            query.find().then(function (sliderImage) {
                defer.resolve(sliderImage);
            }, function (error) {
                defer.reject(error);
            })

            return defer.promise;

        },

        count: function (params) {

            var defer = $q.defer();
            var query = new Parse.Query(this);

            query.count().then(function (objs) {
                defer.resolve(objs);
            }, function (error) {
                defer.reject(error);
            })

            return defer.promise;

        },

        save: function (obj) {

            var defer = $q.defer();

            obj.save().then(function (obj) {
                defer.resolve(obj);
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        },

        delete: function (obj) {

            var defer = $q.defer();
            obj.destroy().then(function (result) {
                defer.resolve(result);
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;

        }

    });

    Object.defineProperty(SliderImage.prototype, 'sort', {
        get: function () {
            return this.get('sort');
        },
        set: function (val) {
            this.set('sort', val);
        }
    });

    Object.defineProperty(SliderImage.prototype, 'image', {
        get: function () {
            return this.get('image');
        },
        set: function (val) {
            this.set('image', val);
        }
    });

    Object.defineProperty(SliderImage.prototype, 'isActive', {
        get: function () {
            return this.get('isActive');
        },
        set: function (val) {
            this.set('isActive', val);
        }
    });

    Object.defineProperty(SliderImage.prototype, 'type', {
        get: function () {
            return this.get('type');
        },
        set: function (val) {
            this.set('type', val);
        }
    });

    Object.defineProperty(SliderImage.prototype, 'place', {
        get: function () {
            return this.get('place');
        },
        set: function (val) {
            this.set('place', val);
        }
    });

    Object.defineProperty(SliderImage.prototype, 'url', {
        get: function () {
            return this.get('url');
        },
        set: function (val) {
            this.set('url', val);
        }
    });

    return SliderImage;

});