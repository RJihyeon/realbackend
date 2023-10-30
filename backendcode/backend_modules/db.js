// DB 연결 로직
// 여기서 db관련 설정 가능 그리고 데이터베이스랑 테이블도 없으면 추가해줌
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

const createTableuserQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id varchar(45) NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    student_id VARCHAR(255),
    affiliation VARCHAR(255),
    division VARCHAR(255),
    phone_num VARCHAR(255),
    email VARCHAR(255)
  )
`;

const createTablereserveQuery = `
  CREATE TABLE IF NOT EXISTS reserve (
    year int,
    month int,
    date int,
    day VARCHAR(255),
    space1 VARCHAR(3),
    space2 VARCHAR(3),
    space3 VARCHAR(3),
    space4 VARCHAR(3),
    space5 VARCHAR(3),
    space6 VARCHAR(3),
    space7 VARCHAR(3),
    student_id VARCHAR(255),
    phone_num VARCHAR(255),
    activities VARCHAR(255),
    use_things VARCHAR(255),
    population VARCHAR(30),
    timestamp timestamp,
    headcount int
  )
`;

db.query('CREATE DATABASE IF NOT EXISTS authtest', (err, results) => { 
  if (err) {
    console.error('데이터베이스를 만들거나 확인하는 중 오류 발생:', err);
  } else {
    console.log('데이터베이스가 만들어졌거나 이미 존재합니다.');
  }  
});  

db.query(createTableuserQuery, (err, results) => {
  if (err) {
    console.error('테이블을 만드는 중 오류 발생:', err);
  } else {
    console.log('user테이블이 만들어졌거나 이미 존재합니다.');
  }
});

db.query(createTablereserveQuery, (err, results) => {
  if (err) {
    console.error('테이블을 만드는 중 오류 발생:', err);
  } else {
    console.log('reserve테이블이 만들어졌거나 이미 존재합니다.');
  }
});

module.exports = db;