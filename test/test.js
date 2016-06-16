var datastore = require('../datastore.js');
require('should');

describe('datastore', () => {
  describe('Auths', () => {
    it('should generate new auth keys that are valid', (done) => {
      datastore.Auths.create(1000, 120).then(token => {
        datastore.Auths.isValid(1000, token).then(isValid => {
          isValid.should.be.ok();
          done();
        });
      });
    });
    it('should make auth keys expire after a while', (done) => {
      datastore.Auths.create(1001, 1).then(token => {
        datastore.Auths.isValid(1001, token).then(isValid => isValid.should.be.ok());
        setTimeout(() => {
          datastore.Auths.isValid(1001, token).then(isValid => {
            isValid.should.not.be.ok();
            done();
          });
        }, 1000);
      });
    });
    it('should have undefined auth keys be invalid', (done) => {
      datastore.Auths.isValid(1001, 'a').then(isValid => isValid.should.not.be.ok()).then(() => done());
    });
    it('should check user IDs', (done) => {
      datastore.Auths.create(1002, 120).then(token => {
        datastore.Auths.isValid(1234, token).then(isValid => {
          isValid.should.not.be.ok();
          done();
        });
      });
    })
  });

  describe('Users', () => {
    it('should generate IDs successfully', (done) => {
      datastore.Users.generateId().then(id => {
        console.log('Generated ID: ', id);
        done();
      });
    });
    it('should create and store users', (done) => {
      datastore.Users.create('Viridian Forest', '10.123', '30.987').then(id => {
        datastore.Users.get(id).then(user => {
          user.name.should.equal('Viridian Forest');
          user.lat.should.equal('10.123');
          user.lon.should.equal('30.987');

          done();
        });
      });
    });
  });

  describe('Entries', () => {
    it('should generate IDs successfully', (done) => {
      datastore.Entries.generateId().then(id => {
        console.log('Generated ID: ', id);
        done();
      });
    });
    it('should create and store entries', (done) => {
      datastore.Entries.create(1000, 1234567890, 1, 14.5).then(id => {
        datastore.Entries.get(id).then(entry => {
          entry.userId.should.equal('1000');
          entry.time.should.equal('1234567890');
          entry.type.should.equal('1');
          entry.value.should.equal('14.5');

          done();
        });
      });
    });
    it('can search by user ID', (done) => {
      datastore.Entries.create(1001, 1234567890, 1, 14.5).then(id => {
        datastore.Entries.allForUser(1001).then(entries => {
          entries.indexOf(id.toString()).should.not.equal(-1);

          done();
        });
      });
    });
    it('can search by type', (done) => {
      datastore.Entries.create(1001, 1234567890, 3, 14.5).then(id => {
        datastore.Entries.allOfType(3).then(entries => {
          entries.indexOf(id.toString()).should.not.equal(-1);

          done();
        });
      });
    });
    it('can search by ID and type', (done) => {
      datastore.Entries.create(1002, 1234567890, 3, 14.5).then(id => {
        datastore.Entries.all(1002, 3).then(entries => {
          entries.indexOf(id.toString()).should.not.equal(-1);

          done();
        });
      });
    });
    it('can get the most recent entry for ID and type', (done) => {
      datastore.Entries.create(1003, 1234567890, 3, 14.5).then(id => {
        datastore.Entries.mostRecent(1003, 3).then(retrievedId => {
          id.toString().should.equal(retrievedId);

          done();
        });
      });
    });
  });
});
