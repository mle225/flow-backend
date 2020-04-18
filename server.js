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
    database:'testflow'
  }
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

//registering 
app.post('/register', (req, res) => {
  const {email, password} = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
    db.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
        })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register')) 
})

//sign in
/*app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      const valid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (valid) {
        return db.select('*').from('users')
        .where('email', '=', req.body.email)
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
*/

app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
  .where('email', '=', req.body.email)
  .then(data => {
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if (isValid) {
      return db.select('*').from('users')
      .where('email', '=', req.body.email)
      .then(user => {
        res.json(user[0])
      })
      .catch(err => res.status(400).json('unable to get user'))
    }
    else 
      res.status(400).json('wrong credentials')
  })
  .catch(err=> res.status(400).json('wrong credentials'))
})

app.listen(3000, () => console.log(' app running on port 3000!'))



// login: username, email, hash
// users: username, email, joined