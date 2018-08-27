var Image = require('../helpers/image');

function saveImage (base64) {
  var parseFile = new Parse.File('image.jpg', { base64: base64 });
  return parseFile.save();
}

Parse.Cloud.define('getHomePageData', (req, res) => {

  const query1 = new Parse.Query('Category')
  query1.ascending('sort')
  query1.limit(10);
  query1.doesNotExist('deletedAt')

  const query2 = new Parse.Query('Place')
  query2.equalTo('status', 'Approved')
  query2.equalTo('isFeatured', true)
  query2.doesNotExist('deletedAt')
  query2.include('category')
  query2.limit(10)
  query2.descending('createdAt')

  const query3 = new Parse.Query('Place')
  query3.equalTo('status', 'Approved')
  query3.doesNotExist('deletedAt')
  query3.include('category')
  query3.limit(10)
  query3.descending('createdAt')

  var pipeline4 = {
    match: {
      status: 'Approved',
      deletedAt: {
        '$exists': false
      }
    },
    sample: {
      size: 50
    }
  }

  const query4 = new Parse.Query('Place')

  const query5 = new Parse.Query('SliderImage')
  query5.equalTo('isActive', true)
  query5.ascending('sort')

  Parse.Promise.when(
    query1.find(),
    query2.find(),
    query3.find(),
    query4.aggregate(pipeline4),
    query5.find())
  .then((categories, featuredPlaces, newPlaces, randomPlaces, slides) => {

    const ids = randomPlaces.map(place => place.objectId)

    const query = new Parse.Query('Place')
    query.containedIn('objectId', ids)
    query.include('category')
    query.find().then(randomPlaces1 => {

      res.success({
        categories: categories,
        featuredPlaces: featuredPlaces,
        newPlaces: newPlaces,
        randomPlaces: randomPlaces1,
        slides: slides
      })

    }, error => {
      res.error(error.message)
    })

  }, function (error)  {
    res.error(error.message)
  })

})

Parse.Cloud.define('getRandomPlaces', async (req, res) => {

  try {

    const pipeline = {
      match: {
        status: 'Approved',
        deletedAt: {
          '$exists': false
        }
      },
      sample: {
        size: 50
      }
    }

    const query = new Parse.Query('Place')

    const results = await Parse.Promise.when(query.aggregate(pipeline))
    
    const ids = results.map(result => result.objectId)

    const query1 = new Parse.Query('Place')
    query1.containedIn('objectId', ids)
    query1.include('category')

    const randomPlaces = await query1.find()

    res.success(randomPlaces)

  } catch (err) {
    res.error(error.message)
  }

})

Parse.Cloud.define('isPlaceStarred', async (req, res) => {

  const user = req.user
  const placeId = req.params.placeId

  if (!user) {
    return res.error('Not Authorized')
  }

  try {

    const objPlace = new Parse.Object('Place')
    objPlace.id = placeId

    const query = new Parse.Query('Review')
    query.equalTo('place', objPlace)
    query.equalTo('user', user)

    let review = await query.first()
    const isStarred = review ? true : false
    res.success(isStarred)

  } catch (err) {
    res.error(err.message)
  }
})

Parse.Cloud.define('isPlaceLiked', async (req, res) => {

  const user = req.user
  const placeId = req.params.placeId

  if (!user) return res.error('Not Authorized')

  try {

    const query = new Parse.Query('Place')
    query.equalTo('likes', user)
    query.equalTo('objectId', placeId)

    const place = await query.first()
    const isLiked = place ? true : false

    res.success(isLiked)

  } catch (err) {
    res.error(err.message)
  }

})

Parse.Cloud.define('likePlace', async (req, res) => {

  const user = req.user
  const placeId = req.params.placeId

  if (!user) return res.error('Not Authorized')

  try {

    const query = new Parse.Query('Place')
    let place = await query.get(placeId)

    if (!place) return res.error('Record not found')
    
    const query1 = new Parse.Query('Place')
    query1.equalTo('likes', user)
    query1.equalTo('objectId', placeId)
    let isLiked = await query1.first()

    const relation = place.relation('likes')

    let response = {}

    if (isLiked) {
      place.increment('likeCount', -1)
      relation.remove(user)
      response.op = 'unlike'
    } else {
      place.increment('likeCount', 1)
      relation.add(user)
      response.op = 'like'
    }

    await place.save(null, { useMasterKey: true })

    res.success(response)

  } catch (err) {
    res.error(err.message)
  }

})

Parse.Cloud.define('getUsers', function (req, res) {

  var params = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    }

    const relation = adminRole.relation('users')

    var query = relation.query()

    if (params.filter != '') {
      query.contains('email', params.filter);
    }

    query.descending('createdAt');
    query.limit(params.limit);
    query.skip((params.page * params.limit) - params.limit);

    var queryUsers = query.find({ useMasterKey: true });
    var queryCount = query.count({ useMasterKey: true });

    return Parse.Promise.when(queryUsers, queryCount);
  }).then(function (users, total) {
    res.success({ users: users, total: total });
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.define('createUser', function (req, res) {

  var data = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    } else {

      var user = new Parse.User();
      user.set('name', data.name);
      user.set('username', data.email);
      user.set('email', data.email);
      user.set('password', data.password);
      user.set('photo', data.photo);
      user.set('roleName', data.roleName);

      var acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(false);
      user.setACL(acl);

      user.signUp().then(function (objUser) {
        res.success(objUser);
      }, function (error) {
        res.error(error);
      });
    }
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.define('updateUser', function (req, res) {

  var data = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    }

    var query = new Parse.Query(Parse.User);
    query.equalTo('objectId', data.id);
    return query.first({ useMasterKey: true });
  }).then(function (objUser) {

    objUser.set('name', data.name);
    objUser.set('username', data.email);
    objUser.set('email', data.email);
    objUser.set('photo', data.photo);

    if (!data.password) {
      objUser.set('password', data.password);
    }

    return objUser.save(null, { useMasterKey: true });
  }).then(function (success) {
    res.success(success);
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.define('destroyUser', function (req, res) {

  var params = req.params;
  var user = req.user;

  var query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  query.first().then(function (adminRole) {

    if (!adminRole) {
      return res.error('Not Authorized');
    }

    var query = new Parse.Query(Parse.User);
    query.equalTo('objectId', params.id);
    return query.first({ useMasterKey: true });
  }).then(function (objUser) {

    if (!objUser) {
      return res.error('User not found');
    }

    return objUser.destroy({ useMasterKey: true });
  }).then(function (success) {
    res.success(success);
  }, function (error) {
    res.error(error);
  });
});

Parse.Cloud.beforeSave('Category', async (req, res) => {

  let obj = req.object
  let user = req.user

  if (!user && !req.master) return res.error('Not Authorized')

  if (!obj.get('image')) return res.error('The field Image is required.')

  if (!obj.existed()) {
    let acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    obj.setACL(acl)
    obj.set('placeCount', 0)
  }

  if (obj.dirty('title') && obj.get('title')) {
    obj.set('canonical', obj.get('title').toLowerCase())
  }

  if (!obj.dirty('image')) return res.success()

  var image = obj.get('image')

  try {

    let httpResponse = await Parse.Cloud.httpRequest({ url: image.url() })
    
    let imageResizedData = await sharp(httpResponse.buffer).resize(600).toBuffer()
    let imageThumbData = await sharp(httpResponse.buffer).resize(200, 200).toBuffer()

    let file = new Parse.File('image.jpg', {
      base64: imageResizedData.toString('base64')
    })

    let thumb = new Parse.File('image.jpg', {
      base64: imageThumbData.toString('base64')
    })

    await file.save()
    await thumb.save()

    obj.set('image', file)
    obj.set('imageThumb', thumb)

    res.success()

  } catch (err) {
    res.error('Unable to process image')
  }

})

Parse.Cloud.beforeDelete('Category', async (req, res) => {
  const obj = req.object

  try {

    const query = new Parse.Query('Place')
    query.equalTo('category', obj)
    const result = await query.first()

    if (result) return res.error('Can\'t delete category if it still has places.')

    res.success()

  } catch (err) {
    res.error(err.message)
  }
})

Parse.Cloud.beforeSave('Place', async (req, res) => {

  let place = req.object
  let user = req.user

  if (!user && !req.master) return res.error('Not Authorized')

  if (place.dirty('title') && place.get('title')) {
    place.set('canonical', place.get('title').toLowerCase())
  }

  if (!place.existed()) {
    let acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    acl.setWriteAccess(user, true)
    place.setACL(acl)
    place.set('status', 'Pending')
    place.set('user', user)
  }

  if (!place.dirty('image') && !place.dirty('imageTwo') &&
   !place.dirty('imageThree') && !place.dirty('imageFour')) {
    return res.success();
  }

  let promises = [];

  if (place.get('image') && place.dirty('image')) {

    let url = place.get('image').url()

    let promise = Parse.Cloud.httpRequest({ url: url }).then(httpResponse => {
      return sharp(httpResponse.buffer).resize(640).toBuffer()
    }).then(imageData => {
      return saveImage(imageData.toString('base64'))
    }).then(savedFile => {
      place.set('image', savedFile)
    })

    promises.push(promise)

    let promiseThumb = Parse.Cloud.httpRequest({ url: url }).then(httpResponse => {
      return sharp(httpResponse.buffer).resize(320, 320).toBuffer()
    }).then(imageData => {
      return saveImage(imageData.toString('base64'))
    }).then(savedFile => {
      place.set('imageThumb', savedFile)
    })

    promises.push(promiseThumb)
  }

  if (place.get('imageTwo') && place.dirty('imageTwo')) {
    let url = place.get('imageTwo').url()

    let promise = Parse.Cloud.httpRequest({ url: url }).then(httpResponse => {
      return sharp(httpResponse.buffer).resize(640).toBuffer()
    }).then(imageData => {
      return saveImage(imageData.toString('base64'))
    }).then(savedFile => {
      place.set('imageTwo', savedFile)
    })
    promises.push(promise)
  }

  if (place.get('imageThree') && place.dirty('imageThree')) {
    let url = place.get('imageThree').url()

    let promise = Parse.Cloud.httpRequest({ url: url }).then(httpResponse => {
      return sharp(httpResponse.buffer).resize(640).toBuffer()
    }).then(imageData => {
      return saveImage(imageData.toString('base64'))
    }).then(savedFile => {
      place.set('imageThree', savedFile)
    })
    promises.push(promise)
  }

  if (place.get('imageFour') && place.dirty('imageFour')) {
    let url = place.get('imageFour').url()

    let promise = Parse.Cloud.httpRequest({ url: url }).then(httpResponse => {
      return sharp(httpResponse.buffer).resize(640).toBuffer()
    }).then(imageData => {
      return saveImage(imageData.toString('base64'))
    }).then(savedFile => {
      place.set('imageFour', savedFile)
    })
    promises.push(promise)
  }

  try {
    await Parse.Promise.when(promises)
    res.success()
  } catch (err) {
    res.error(err.message)
  }
});

Parse.Cloud.afterSave('Place', async (req, res) => {

  if (!req.object.existed()) {
    const attrs = req.object.attributes
    const category = attrs.category
    category.increment('placeCount')
    category.save(null, { useMasterKey: true })
  }

})

Parse.Cloud.afterDelete('Place', async (req, res) => {

  const obj = req.object
  const attrs = obj.attributes

  try {

    const category = attrs.category
    category.increment('placeCount', -1)
    category.save(null, { useMasterKey: true })

  } catch (err) {
    console.warn(err.message)
  }

  try {

    const query = new Parse.Query('Review')
    query.equalTo('place', obj)
    const count = await query.count()
    query.limit(count)
    const results = await query.find()
    const op = await Parse.Object.destroyAll(results, { useMasterKey: true })

  } catch (err) {
    console.warn(err.message)
  }
  
})

Parse.Cloud.beforeSave('Review', async (req, res) => {

  let obj = req.object
  let user = req.user
  const attrs = obj.attributes

  if (!user && !req.master) return res.error('Not Authorized')

  if (!obj.existed()) {
    let acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    acl.setWriteAccess(user, true)
    obj.setACL(acl)
    obj.set('user', user)
    obj.set('isInappropriate', false)
  } else {
    res.success();
  }

  try {

    let query = new Parse.Query('Review')
    query.equalTo('user', user)
    query.equalTo('place', attrs.place)

    let exists = await query.first()

    if (exists) {
      return res.error(5000, 'You already write a review for this place')
    } else if (obj.get('rating') < 1) {
      return res.error(5001, 'You cannot give less than one star')
    } else if (obj.get('rating') > 5) {
      return res.error(5002, 'You cannot give more than five stars')
    } else {
      res.success()
    }

  } catch (err) {
    res.error(err.message)
  }

});

Parse.Cloud.afterSave('Review', async (req) => {

  const attrs = req.object.attributes

  try {

    let query = new Parse.Query('Place')
    let place = await query.get(attrs.place.id)

    if (place) {
      place.increment('ratingCount')
      place.increment('ratingTotal', attrs.rating)
      place.save(null, { useMasterKey: true })
    }

  } catch (err) {
    console.warn(err.message)
  }

})

Parse.Cloud.beforeSave(Parse.User, async (req, res) => {

  let user = req.object

  // We need to retrieve extra data
  // if user was logged in with facebook

  let authData = user.get('authData')

  if (!user.existed() && authData) {

    try {

      let httpResponse = await Parse.Cloud.httpRequest({
        url: 'https://graph.facebook.com/me?fields=email,id,name&access_token=' + authData.facebook.access_token
      })
        
      user.set('name', httpResponse.data.name)
      user.set('username', httpResponse.data.id)
      user.set('facebookId', httpResponse.data.id)

      let paramsRequest = {
        url: 'https://graph.facebook.com/' + authData.facebook.id + '/picture',
        followRedirects: true,
        params: { type: 'large' }
      }
        
      let httpResponse1 = await Parse.Cloud.httpRequest(paramsRequest)

      let buffer = httpResponse1.buffer
      let base64 = buffer.toString('base64')
      let parseFile = new Parse.File('image.jpg', { base64: base64 })

      await parseFile.save()
      user.set('photo', parseFile)

      res.success()

    } catch (err) {
      res.error('Facebook request error')
    }

  } else {
    
    if (!user.get('photo') || !user.dirty('photo')) return res.success()

    let imageUrl = user.get('photo').url()

    try {

      let httpResponse = await Parse.Cloud.httpRequest({ url: imageUrl })
      
      let imageResizedData = await sharp(httpResponse.buffer).resize(200, 200).toBuffer()
  
      let file = new Parse.File('image.jpg', {
        base64: imageResizedData.toString('base64')
      })
  
      await file.save()
  
      user.set('photo', file)
  
      res.success()
  
    } catch (err) {
      res.error('Unable to process image')
    }

  }
})

Parse.Cloud.afterSave(Parse.User, function (req) {

  var user = req.object;

  if (!user.existed()) {

    var roleName = user.get('roleName');

    var query = new Parse.Query(Parse.Role);
    query.equalTo('name', roleName);
    query.first({ useMasterKey: true }).then(function (role) {

      if (!role) return;

      role.getUsers().add(user);
      return role.save(null, { useMasterKey: true });
    });
  }
})

Parse.Cloud.beforeSave('SliderImage', (req, res) => {

  let obj = req.object
  let user = req.user

  if (!user && !req.master) return res.error('Not Authorized')

  if (!obj.existed()) {
    let acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    obj.setACL(acl)
    obj.set('isActive', true)
  }

  res.success()
})

Parse.Cloud.beforeSave('Post', async (req, res) => {

  let obj = req.object
  let user = req.user

  if (!user && !req.master) return res.error('Not Authorized')

  if (!obj.existed()) {
    let acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    obj.setACL(acl)
  }

  if (obj.dirty('title') && obj.get('title')) {
    obj.set('canonical', obj.get('title').toLowerCase())
  }

  if (!obj.get('image')) return res.success()

  var image = obj.get('image')

  try {

    let httpResponse = await Parse.Cloud.httpRequest({ url: image.url() })
    
    let imageResizedData = await sharp(httpResponse.buffer).resize(600).toBuffer()
    let imageThumbData = await sharp(httpResponse.buffer).resize(200, 200).toBuffer()

    let file = new Parse.File('image.jpg', {
      base64: imageResizedData.toString('base64')
    })

    let thumb = new Parse.File('image.jpg', {
      base64: imageThumbData.toString('base64')
    })

    await file.save()
    await thumb.save()

    obj.set('image', file)
    obj.set('imageThumb', thumb)

    res.success()

  } catch (err) {
    res.error('Unable to process image')
  }
})

Parse.Cloud.afterSave('Post', (req) => {

  const obj = req.object
  const attrs = obj.attributes

  if (!obj.existed()) {

    const query = new Parse.Query(Parse.Installation)
    query.containedIn('deviceType', ['ios', 'android'])
    
    const params = {
      where: query,
      data: {
        alert: attrs.title,
        sound: 'default'
      }
    }

    Parse.Push.send(params, { useMasterKey: true })
  }

})

Parse.Cloud.beforeSave('Notification', (req, res) => {

  let obj = req.object
  let user = req.user

  if (!user && !req.master) return res.error('Not Authorized')

  if (!obj.existed()) {
    let acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    obj.setACL(acl)
  }

  res.success()
})

Parse.Cloud.afterSave('Notification', (req, res) => {

  const obj = req.object
  const attrs = obj.attributes

  if (!obj.existed()) {

    const query = new Parse.Query(Parse.Installation)
    query.containedIn('deviceType', ['ios', 'android'])
    
    const params = {
      where: query,
      data: {
        alert: attrs.message,
        sound: 'default'
      }
    }

    Parse.Push.send(params, { useMasterKey: true })
  }

})