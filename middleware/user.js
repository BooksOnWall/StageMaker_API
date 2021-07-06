var express = require('express');
var user = express.Router();
const fs = require('fs');
var crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');

var privatekey = process.env.CRYPTO_KEY;
const salt = (privatekey) ? privatekey : crypto.randomBytes(16).toString('hex');

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;
let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'AbrahCadaBrah';

//adding salt to .env at first use
if(!privatekey) {
  const fs = require('fs');
  fs.writeFile(".env", "CRYPTO_KEY="+salt, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("The key was saved!");
  });
}
function encrypt(text) {
  const hash = crypto.pbkdf2Sync(text, salt, 2048, 32, 'sha512').toString('hex');
  return [salt, hash].join('$');
}
function decrypt(hash) {
  hash = crypto.pbkdf2Sync(hash, salt, 2048, 32, 'sha512').toString('hex');
  return hash;
}
function compare(hash, password) {
  const originalHash = password.split('$')[1];
  hash = crypto.pbkdf2Sync(hash, salt, 2048, 32, 'sha512').toString('hex');
  return hash === originalHash;
}

// const getUser =  ({email}) => {
//   try {
//     let users;
//     users = fs.readFileSync('./conf/db/users.json', 'utf8');
//
//     if (users === undefined) {
//     } else {
//       users = JSON.parse(users);
//       var user = users.find(o => o.email === email);
//       return user;
//     }
//   } catch(e) {
//     console.log(e.message);
//   }
// };
const createUser = async ({ name, email, hash, active }) => {
  let password = hash;
  try{
    const res =  await Users.create({ name, email, password, active });
    const uid = await res.get('id');
    var dir = __dirname + '/public/users/'+uid;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, 0o744);
    }
    return res;
  } catch(e) {
    console.log(e.message);
  }
}
const patchUser = async ({ id, name, email, active }) => {
  return await Users.update({ id, name, email, active },
    { where: {id : id}}
  );
}
const patchUserPasswd = async ({ id, hash }) => {
  return await Users.update({ password: hash },{ where: {id : id}});
}
const getAllUsers = async () => {
  return await Users.findAll();
};

const getUser = async obj => {
  return await Users.findOne({
    where: obj,
  });
};
const deleteUser = async (uid) => {
  let res= await Users.destroy({
    where: {id : uid}
  });
  //remove user directory
  rimraf.sync("./public/users/"+uid);
  return res;
};

module.exports = ({sequelize}) => {
  // middleware that is specific to this router
  // create user model
  const users = require('../conf/db/users');
  const groups = require('../conf/db/groups');
  const permissions = require('../conf/db/permissions');
  const Users = sequelize.define('users', users);
  const Groups = sequelize.define('groups', groups);
  const Permissions = sequelize.define('permissions', permissions);
  Permissions.belongsTo(Groups, { foreignKey: 'gid', targetKey: 'id' });
  Groups.hasMany(Permissions, { foreignKey: 'gid', sourceKey: 'id'});
  // create table with user model
  Users.sync()
   .then(() => {
     console.log('User table created successfully');
     var dir_root = __dirname + '/public';
     if (!fs.existsSync(dir_root)) {
         fs.mkdirSync(dir_root, 0o744);
         console.log('Public directory created successfully')
     }

     var dir = __dirname + '/public/users';
     if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, 0o744);
         console.log('User directory created successfully')
     }
     Groups.sync()
      .then(() => {
        console.log('Groups table created successfully');
        // create table with permissions model
        Permissions.sync()
         .then(() => {
           console.log('Permissions table created successfully');
         })
         .catch(err => console.log('oooh,error creating database Permissions , did you enter wrong database credentials?', err));
      })
      .catch(err => console.log('oooh, error creating database Groups ,did you enter wrong database credentials?', err));
   })
   .catch(err => console.log('oooh, error creating database User or directory , did you enter wrong database credentials? is your user folder created server side ?'));


  user.get('/', function(req, res) {
    res.send('hello world');
  });
  user.post('/login', async function(req, res, next) {
    // wrong type of object send by fetch post request can't find why
    // here is a hack
    var body = "";
    for (let i in req.body) {
      body = i;
    }
    const { email, password } = JSON.parse(body);
    if (email && password) {
      try {
        let user = getUser({email});
        if (!user) {
          return res.status(400).json({ message: 'No such user found' });
        }
        let hash = user.passwd;
        if(hash) {
          if (hash === password) {
            // Passwords match
            // from now on we'll identify the user by the id and the id is the
            // only personalized value that goes into our token
            let payload = { id: user.id };
            let token = jwt.sign(payload, jwtOptions.secretOrKey);
            let name = user.name;
            let uid = user.id;
            return res.status(200).json({
              msg: 'ok',
              token: token,
              id: uid,
              email: user.email,
              name: name
            });
          } else {
            // Passwords don't match
            return res.status(400).json({ msg: 'Password is incorrect' });
          }
        }
      } catch(e) {
        console.log(e);
      }
    }
  });
  user.post('/user/verify', passport.authenticate('jwt', { session: false }),
    function(req, res) {
        res.json({msg: 'ok', token: req.body.token, user: {isLoggedIn: true}});
    }
  );
  return user;
}
