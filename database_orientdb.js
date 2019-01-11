var OrientDB = require('orientjs');

var server = OrientDB({
  host: 'localhost',
  port: 2424,
  username: 'root',
  password: 'studiocrediblewithkanghyukjin12'
});

var db = server.use({
   name:     'MyRhy',
   username: 'root',
   password: 'studiocrediblewithkanghyukjin12'
});
console.log('Using database: ' + db.name);

var rec = db.record.get('#25:0').then(function(record){
  console.log('Loaded Record:', record.userName);
});

db.class.get('user').then(function(user){
  user.create({
     userName: "Sancheon",
     userId: "1"
  })
});
