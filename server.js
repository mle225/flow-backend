const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcryptjs');

//DB here later
const db = knex({
  client: 'pg',
  connection: {
    host:'127.0.0.1',
    user: 'minhle',
    password:'',
    database:'flowtest'
  }
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

//registering 
app.post('/register', (req, res) => {
  const {username, email, password} = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
    db.transaction(trx => {
      trx.insert({
        username: username,
        hash: hash,
        email: email
      })
      .into('account')
      .returning('*')
      .then(user => {
        return trx('member')
        .returning('*')
        .insert({
          memberid: user[0].id,
          name: username,
          tripid: null
        })
        .then(user => {
          res.json(user[0]);
          console.log(user[0]);
        })
        .catch(err => res.status(400).json('Username/ Email already taken'))
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json(err)) 
})

//sign in
app.post('/signin', (req, res) => {
  db.select('email', 'hash', 'id').from('account')
    .where('email', '=', req.body.email)
    .then(data => {
      const valid = bcrypt.compareSync(req.body.password, data[0].hash);
      const id = data[0].id;
      if (valid) {
        return db.select('*').from('member')
        .where('memberid', '=', id)
        .then(user => {
          res.json(user[0])
        })
        .catch(err => res.status(400).json('unable to find user'))
      }
      else 
        res.status(400).json('wrong email/password')
    })
    .catch(err => res.status(400).json('wrong email/password'))
})

app.listen(3000, () => console.log(' app running on port 3000!'))
