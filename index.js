var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var datastore = require('./datastore');
var config = require('./config.json');

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('test')
});

app.post('/auth', (req, res) => {
  if (req.body.key === config.adminKey) {
    datastore.Auths.create(req.body.userId, req.body.expireSec).then(token => {
      res.json({ token });
    })
  } else {
    res.status(401).json({error: "Invalid key"});
  }
});

app.post('/users', (req, res) => {
  if (req.body.key === config.adminKey) {
    datastore.Users.create(req.body.name, req.body.lat, req.body.lon).then(id => {
      res.json({ id });
    });
  } else {
    res.status(401).json({error: "Invalid key"});
  }
});

app.get('/users/:id', (req, res) => {
  datastore.Users.get(req.params.id).then(user => {
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({error: "User not found"});
    }
  });
});

app.post('/entries', (req, res) => {
  datastore.Auths.isValid(req.body.userId, req.body.token).then(valid => {
    if (valid) {
      datastore.Entries.create(req.body.userId, req.body.time, req.body.type, req.body.value).then(id => {
        res.json({ id });
      });
    } else {
      res.status(403).json({error: "Invalid token for user ID"});
    }
  })
});

app.get('/entries/type/:type', (req, res) => {
  datastore.Entries.allOfType(req.params.type).then(entries => {
    res.json(entries);
  })
});

app.get('/entries/user/:userId', (req, res) => {
  datastore.Entries.allForUser(req.params.userId).then(entries => {
    res.json(entries);
  })
});

app.get('/entries/all/:userId/:type', (req, res) => {
  datastore.Entries.all(req.params.userId, req.params.type).then(entries => {
    res.json(entries);
  });
});

app.get('/entries/most-recent/:userId/:type', (req, res) => {
  datastore.Entries.mostRecent(req.params.userId, req.params.type).then(id => {
    datastore.Entries.get(id).then(entry => {
      entry.id = id;
      res.json(entry);
    })
  });
});

app.get('/entries/:id', (req, res) => {
  datastore.Entries.get(req.params.id).then(entry => {
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({error: "Entry not found"});
    }
  });
});

app.listen(3000, () => console.log('Test'));
