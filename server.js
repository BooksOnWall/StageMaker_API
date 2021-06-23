var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
const prettyBytes = require('pretty-bytes');
const { exec } = require("child_process");
const bodyParser = require('body-parser');
//CORS
var cors = require('cors');

// ENV set url(localhost/other) port (1234) and protocol (http/https)
require('dotenv').config();
const host = process.env.SERVER_HOST;
const protocol = process.env.SERVER_PROTOCOL;
const port = process.env.SERVER_PORT;
//proxy port  usefull if you use an web proxy to run your server on one port and make it accessible on another , set correct src path url on upload/download files
const proxy = process.env.PROXY_PORT;
const serverUrl = protocol + '://'+ host + ':' + proxy +'/';

var crypto = require('crypto');
var privatekey = process.env.CRYPTO_KEY;
const salt = (privatekey) ? privatekey : crypto.randomBytes(16).toString('hex');
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

//jwt_payload & passport
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'AbrahCadaBrah';
const getUser =  ({id}) => {
  try {
    let users;
    users = fs.readFileSync('./conf/db/users.json', 'utf8');

    if (users === undefined) {
      console.log('undefined');
    } else {
      users = JSON.parse(users);
      var user = users.find(o => o.id === id);
      return user;
    }
  } catch(e) {
    console.log(e.message);
  }
};
// lets create our strategy for web token
let strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  let user = getUser({ id: jwt_payload.id });

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});
// use the strategy
passport.use(strategy);

///////////////////  APP ////////////////
var app = express();

// initialize passport with express
app.use(passport.initialize());

// cors integration
var allowedOrigins = [
      '*',
      'https://localhost:8000',
      'https://stagemaker.booksonwall.art',
      'http://localhost:8000'
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.[Server.js:80]';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// parse application/json
// Tell the bodyparser middleware to accept more data
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


//cors middleware causes express to reject connection
// adding headers Allow-Cross-Domain

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Method', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'content-type');
  next();
}
app.use(allowCrossDomain);

// use middleware
var user = require('./middleware/user');


app.use('/',user());
app.use('/login',user());

// start app
const startMsg = 'Manage RESTFULL Server listening on port ' + port + '! Go to ' + protocol + '://' + host + ':' + port + '/';
if (protocol === 'https') {
  var key = fs.readFileSync('./privkey.pem');
  var cert = fs.readFileSync('./fullchain.pem');
  var options = {
      key: key,
      cert: cert
  };
  https.createServer(options, app)
  .listen(port, function () {
    console.log(startMsg)
  });
} else {
  http.createServer(app)
  .listen(port, function () {
    console.log(startMsg)
  });
}
