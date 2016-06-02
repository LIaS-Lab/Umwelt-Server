var crypto = require('crypto');
var redis = require('redis'), client = redis.createClient();

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
  generateId: function() {
    return new Promise((resolve, reject) => {
      client.incr('next_user_id', (err, id) => {
        if (err) reject(err);
        else resolve(id);
      });
    });
  },
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

module.exports = { Auths, Users }
