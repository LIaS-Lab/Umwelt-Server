var crypto = require('crypto');
var redis = require('redis'), client = redis.createClient();

function generateIdFunction(key) {
  return function() {
    return new Promise((resolve, reject) => {
      client.incr(`next_${key}_id`, (err, id) => {
        if (err) reject(err);
        else resolve(id);
      });
    });
  }
}

var Auths = {
  generateToken: function() {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(48, (err, res) => {
        if(err) reject(err);
        else resolve(res.toString('hex'));
      });
    });
  },
  create: function(userId, expireSec) {
    return Auths.generateToken().then(token => {
      var key = `auth:${token}`;
      client.set(key, userId);
      client.expire(key, expireSec);
      return token;
    });
  },
  isValid: function(userId, token) {
    return new Promise((resolve, reject) => {
      var key = `auth:${token}`;
      client.get(key, (err, res) => {
        if (err) resolve(false);
        else resolve(res == userId);
      });
    });
  }
}

var Users = {
  generateId: generateIdFunction('user'),
  create: function(name, lat, lon) {
    return Users.generateId().then(id => {
      var key = `user:${id}`;
      client.hmset(key, { name, lat, lon });
      return id;
    });
  },
  get: function(id) {
    return new Promise((resolve, reject) => {
      var key = `user:${id}`;
      client.hgetall(key, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }
};

var Entries = {
  generateId: generateIdFunction('entry'),
  create: function(userId, time, type, value) {
    return Entries.generateId().then(id => {
      var key = `entry:${id}`;
      client.hmset(key, { userId, time, type, value });
      client.sadd(`entries:type:${type}`, id);
      client.sadd(`entries:userId:${userId}`, id);
      client.set(`entries:mostRecent:${userId}:${type}`, id);
      return id;
    })
  },
  get: function(id) {
    return new Promise((resolve, reject) => {
      var key = `entry:${id}`;
      client.hgetall(key, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  },
  getBulk: function(ids) {
    return new Promise((resolve, reject) => {
      var commands = ids.map(val => ['hgetall', `entry:${val}`]);
      client.multi(commands).exec((err, res) => {
        if (err) reject(err);
        else {
          // Add IDs to result
          res.forEach((elem, idx) => {
            elem.id = ids[idx];
          });
          resolve(res);
        }
      });
    });
  },
  allForUser: function(userId) {
    return new Promise((resolve, reject) => {
      client.smembers(`entries:userId:${userId}`, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  },
  allOfType: function(type) {
    return new Promise((resolve, reject) => {
      client.smembers(`entries:type:${type}`, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  },
  all: function(userId, type) {
    return new Promise((resolve, reject) => {
      client.sinter(`entries:type:${type}`, `entries:userId:${userId}`, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  },
  mostRecent: function(userId, type) {
    return new Promise((resolve, reject) => {
      client.get(`entries:mostRecent:${userId}:${type}`, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }
}

module.exports = { Auths, Users, Entries }
