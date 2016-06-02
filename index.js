var express = require('express');
var app = express();

var datastore = require('./datastore');

app.get('/', (req, res) => {
  res.send('test')
});

app.get('/auth', (req, res) => {
  res.json({

  })
})

app.listen(3000, () => console.log('Test'));
