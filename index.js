var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var datastore = require('./datastore');
var config = require('./config.json');

app.use(bodyParser.json());

// Test request
// No parameters
// Always returns "test"
app.get('/', (req, res) => {
  res.send('test')
});

// Create an auth token
// Parameters (JSON):
//   key - the admin key defined on the server
//   userId - the user ID to create a token for
//   expireSec - after how many seconds this token should expire
// Returns (JSON):
//   token - the created token
app.post('/auth', (req, res) => {
  if (req.body.key === config.adminKey) {
    datastore.Auths.create(req.body.userId, req.body.expireSec).then(token => {
      res.json({ token });
    })
  } else {
    res.status(401).json({error: "Invalid key"});
  }
});

// Create a user
// Parameters (JSON):
//   key - the admin key defined on the server
//   name - a name for the user, doesn't have to be unique
//   lat - the user's latitude
//   lon - the user's longitude
// Returns (JSON):
//   id - the created user's ID
app.post('/users', (req, res) => {
  if (req.body.key === config.adminKey) {
    datastore.Users.create(req.body.name, req.body.lat, req.body.lon).then(id => {
      res.json({ id });
    });
  } else {
    res.status(401).json({error: "Invalid key"});
  }
});

// Get a user by ID
// Parameters (URL):
//   id - the ID for which the user should be obtained
// Returns (JSON):
//   name - the obtained user's name
//   lat - the user's latitude
//   lon - the user's longitude
app.get('/users/:id', (req, res) => {
  datastore.Users.get(req.params.id).then(user => {
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({error: "User not found"});
    }
  });
});

// Create an entry
// Parameters (JSON):
//   userId - the ID of the creating user
//   token - an auth token valid for the creating user
//   time - the unix timestamp at which this entry should be created
//   type - the type of entry to be created (arbitrary integer, to be defined
//          later)
//   value - the value this entry should have, in a unit defined by the type
// Returns (JSON):
//   id - the ID of the created entry
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

// Get all entries of a particular type
// Parameters (URL):
//   type - the type to get entries for (arbitrary integer)
// Returns (JSON) - an array of entry IDs
app.get('/entries/type/:type', (req, res) => {
  datastore.Entries.allOfType(req.params.type).then(entries => {
    res.json(entries);
  })
});

// Get all entries of a particular user
// Parameters (URL):
//   userId - the user ID to get entries for
// Returns (JSON) - an array of entry IDs
app.get('/entries/user/:userId', (req, res) => {
  datastore.Entries.allForUser(req.params.userId).then(entries => {
    res.json(entries);
  })
});

// Get all entries of a particular user and type
// Parameters (URL):
//   userId - the user ID to get entries for
//   type - the type to get entries for (arbitrary integer)
// Returns (JSON) - an array of entry IDs
app.get('/entries/all/:userId/:type', (req, res) => {
  datastore.Entries.all(req.params.userId, req.params.type).then(entries => {
    res.json(entries);
  });
});

// Get the most recent entry (highest time) of a particular user and type
// Parameters (URL):
//   userId - the user ID to get an entry for
//   type - the type to get an entry for
// Returns (JSON):
//   id - the ID of the entry
//   userId - the ID of the user that created the entry
//   time - the unix timestamp at which the entry was created
//   type - the type the entry is (arbitrary integer, to be defined later)
//   value - the value the entry has, in a unit defined by the type
app.get('/entries/most-recent/:userId/:type', (req, res) => {
  datastore.Entries.mostRecent(req.params.userId, req.params.type).then(id => {
    datastore.Entries.get(id).then(entry => {
      entry.id = id;
      res.json(entry);
    })
  });
});

// Get entries in bulk
// Parameters (GET):
//   id (multiple) - the IDs to get entries for
// Returns (JSON):
//   Array of [
//     id - the ID of the entry
//     userId - the ID of the user that created the entry
//     time - the unix timestamp at which the entry was created
//     type - the type the entry is (arbitrary integer, to be defined later)
//     value - the value the entry has, in a unit defined by the type
//   ]
// Example:
//   GET /entries/bulk?id=124&id=125&id=126
app.get('/entries/bulk', (req, res) => {
  entryIds = req.query.id;
  datastore.Entries.getBulk(entryIds).then(entries => {
    res.json(entries);
  });
});

// Get a particular entry by ID
// Parameters (URL):
//   id - the ID for which to get the entry
// Returns (JSON):
//   userId - the ID of the user that created the entry
//   time - the unix timestamp at which the entry was created
//   type - the type the entry is (arbitrary integer, to be defined later)
//   value - the value the entry has, in a unit defined by the type
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
