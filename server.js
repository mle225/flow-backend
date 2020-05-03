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
    user: '',
    password:'',
    database:'flowtest'
  }
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/register', (req, res) => {
  const {name, email, password} = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  db.transaction(trx => {
    db.insert({name: name, hash: hash, email: email})
      .into('account')
      .returning('*')
      .then(data1 => {
        db.insert({id: data1[0].id, name: name, tripid: null})
          .into('member')
          .returning('*')
          .then(data2 => {
            const id = data2[0].id;
            const name = data2[0].name;
            let user = {
              id: id,
              avatar: '',
              name : name,
              email: email,
              trips : [],  
            }
            res.json(user);
          })
          .catch(err => res.status(400).json(err))
        })
      .then(trx.commit)
      .catch(trx.rollback)
  }).catch(err => res.status(400).json(err)) 
})

app.post('/signin', async (req, res) => {
  try {
    let data = await db.select('*').from('account').where('email', '=', req.body.email);
    if (data) {
      const valid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (valid) {
        const id = data[0].id;
        const name = data[0].name;
        const email = data[0].email;
        let tripids = await db.select('tripid').from('member').where('id', '=', id);
        let trips = [];
        if (tripids && tripids.length > 0) {
          for (let item of tripids) {
            let trip = await db.select('*').from('trip').where('id', '=', item.tripid);
            trips.push(trip[0]);
          }
        }
        let user = {
          id: id,
          avatar: '',
          name : name,
          email: email,
          trips : trips,  
        }
        res.json(user);
      }
      else {
        res.status(400).json('wrong email/password');
      }
    } else {
      res.status(400).json('wrong email/password');
    }
  }
  catch (error) {
    res.status(400).json('user not found');
  }
})

//testing fetch data
app.get('/trips/:name/', async (req, res) => {
  try{
    const {name} = req.params; 
    let arr = await db.select('tripid').from('member').where('name', '=', name);
    if(arr && arr.length>0){
      for(let item of arr){
        let tripResult  = await db.select('name').from('trip').where('id', '=', item.tripid).catch(e=>e);
        item.trip = tripResult && tripResult[0]? tripResult[0]:null;
      }
    }
    return res.json(arr);
  }
  catch(error){
    return res.status(400).json('user not found');
  }
})

app.listen(3000, () => console.log(' app running on port 3000!'))
