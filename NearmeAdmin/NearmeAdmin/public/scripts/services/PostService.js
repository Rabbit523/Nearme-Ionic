angular.module('app').factory('Post', function ($q) {

    var Post = Parse.Object.extend('Post', {

    }, {

            new() {
                return new Post();
            },

            all: function (params) {

                var defer = $q.defer();
                var query = new Parse.Query(this);

                if (params && params.search) {
                    query.contains('canonical', params.search);
                }

                if (params && params.limit && params.page) {
                    query.limit(params.limit);
                    query.skip((params.page * params.limit) - params.limit);
                }

                if (params && params.orderby == "asc") {
                    query.ascending(params.orderbytable);
                } else if (params && params.orderby == "desc") {
                    query.descending(params.orderbytable);
                } else {
                    query.descending('createdAt');
                }

                query.include('place');

                query.find().then(function (itemCategory) {
                    defer.resolve(itemCategory);
                }, function (error) {
                    defer.reject(error);
                })

                return defer.promise;

            },

            search: function (params) {

                var defer = $q.defer();
                var query = new Parse.Query(this);

                query.equalTo('isActive', true);
                query.include('place');

                query.find().then(function (post) {
                    defer.resolve(post);
                }, function (error) {
                    defer.reject(error);
                })

                return defer.promise;

            },

            count: function (params) {

                var defer = $q.defer();
                var query = new Parse.Query(this);

                if (params && params.search) {
                    query.contains('canonical', params.search);
                }

                query.count().then(function (post) {
                    defer.resolve(post);
                }, function (error) {
                    defer.reject(error);
                })

                return defer.promise;

            },

            save: function (post) {

                var defer = $q.defer();

                post.save().then(function (obj) {
                    defer.resolve(obj);
                }, function (error) {
                    defer.reject(error);
                });

                return defer.promise;
            },
            delete: function (obj) {

                var defer = $q.defer();
                obj.destroy().then(function (sucess) {
                    defer.resolve(sucess);
                }, function (error) {
                    defer.reject(error);
                });

                return defer.promise;

            }

        });

    Object.defineProperty(Post.prototype, 'title', {
        get: function () {
            return this.get('title');
        },
        set: function (val) {
            this.set('title', val);
        }
    });

    Object.defineProperty(Post.prototype, 'body', {
        get: function () {
            return this.get('body');
        },
        set: function (val) {
            this.set('body', val);
        }
    });

    Object.defineProperty(Post.prototype, 'image', {
        get: function () {
            return this.get('image');
        },
        set: function (val) {
            this.set('image', val);
        }
    });

    Object.defineProperty(Post.prototype, 'imageThumb', {
        get: function () {
            return this.get('imageThumb');
        },
        set: function (val) {
            this.set('imageThumb', val);
        }
    });

    Object.defineProperty(Post.prototype, 'place', {
        get: function () {
            return this.get('place');
        },
        set: function (val) {
            this.set('place', val);
        }
    });

    return Post;

});