angular.module('app').factory('Notification', function ($q) {

    var Notification = Parse.Object.extend('Notification', {

    }, {

        new() {
            return new Notification();
        },

        save: function (obj) {

            var defer = $q.defer();

            obj.save().then(function (obj) {
                defer.resolve(obj);
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        }

    });

    Object.defineProperty(Notification.prototype, 'message', {
        get: function () {
            return this.get('message');
        },
        set: function (val) {
            this.set('message', val);
        }
    });

    return Notification;

});