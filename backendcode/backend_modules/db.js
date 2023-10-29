// DB 연결 로직

const mysql = require('mysql2');

// connection to db
const db = mysql.createConnection({
    host : 'localhost',
    port : 3306,
    user : 'root',
    password : '1234',
    database : 'authtest'
})

db.connect((err) => {
    if (err) {
      console.error('MySQL 연결 오류:', err);
    } 
    else {
      console.log('MySQL 연결 성공');
    }
  });
  

module.exports = db;