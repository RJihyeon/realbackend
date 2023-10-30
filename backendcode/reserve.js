const express = require('express');
const http = require('http');
const serveStatic = require('serve-static');      //특정 폴더의 파일들을 특정 패스로 접근할 수 있도록 열어주는 역할
const path = require('path');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const expressSession = require('express-session');
const mysqlSession = require('express-mysql-session')(expressSession);
var app = express();      //express 서버 객체
const socketIo = require('socket.io');
let bodyParser_post = require('body-parser');       //post 방식 파서
let router = express.Router();
var usId;

//모듈 호출
const db = require('./backend_modules/db'); 
const nodemail = require('./backend_modules/node_email');




function openreserve(io) {
    // Socket.IO 이벤트 리스너 등록 -> 웹소켓 연결 시
    io.on('connection', (socket) => {
      console.log('A user connected');
      var info;
      
      // 예약 관련 소켓 이벤트 처리 -> 이벤트 이름을 makeReservation으로 해야 응답을 받을 수 있음
      socket.on('makeReservationfirst', (data) => {//data에는 클라이언트에서 서버로 전송된 데이터가 들어감
        // 예약을 처리하고 클라이언트에 응답을 보낼 수 있음
        
        db.query('SELECT data FROM sessions', function(err, row) {//세션정보에 담긴 번호를 가져옴 바로 DB에서
          if(err) {
              console.log(err);
          }    
          if(row.length > 0) {
            const firstdata = row[0].data;
            const jsondata = JSON.parse(firstdata);
            const userPhoneNum = jsondata.user.phone_num;
            const studentID = jsondata.user.student_id;
            info = [userPhoneNum, data[0],data[1],data[2],data[3] + "00",studentID, data[5], data[6]]
            db.query(`INSERT INTO reserve(phone_num, year, month, date, space${data[4]},student_id, population, activities) VALUE(?,?,?,?,?,?,?,?)`//reserve db에 삽입
            , info, function(err, row) {//population이 이용사람수이긴한데 필요없으면 바꿈
                if(err) {
                    console.log(err);
                }    
                else {
                  db.query('SELECT * FROM reserve WHERE phone_num = ?', userPhoneNum, function(err, row) {//클라이언트쪽으로 넘길 자료 
                    if(err) {                                                                         //이거 row에 그 번호에 따른 reserve에서 행들이 들어감
                        console.log(err);
                    }    
                    if(row.length > 0) {
                      // io.emit() 또는 socket.emit()을 사용하여 클라이언트에 데이터를 보낼 수 있음 io가 모두, socket이 특정 ->일단 io로 해봄
                      io.emit('waitReserve', row[0]); //클라이언트에서도 이벤트이름 : waitReserve
                      
                    }
                  }); 
                }
            }); 
        
          }
        });  
        
 
        
      });
      socket.on('cancelReservation', (data) => {//클라이언트쪽에서 자료 넘어오면 근거로 db에서 없애고 클라이언트에 반환
        db.query('SELECT data FROM sessions', function(err, row) {//세션정보에 담긴 번호를 가져옴 바로 DB에서
          if(err) {
              console.log(err);
          }    
          if(row.length > 0) {
            const firstdata = row[0].data;
            const jsondata = JSON.parse(firstdata);
            const userEmail = data[5];
            const studentID = jsondata.user.student_id; //일단 학번으로 본인확인하는 느낌
            const state = data[3] + '00'; //그 data[3]시간대에 대기 상태라는것을 확인
            var stinfo = [data[0], data[1], data[2], studentID, state];
            db.query(`DELETE FROM reserve WHERE year = ? AND month = ? AND date = ? AND student_id = ? AND space${data[4]} = ?` 
              ,stinfo , function(err, row) {
                if(err) {
                  console.log('해당 데이터가 db에 없습니다');
                }
                else {
                  console.log("삭제 완료");
                  if(jsondata.user.userId === "manager") { //node mailer로 구현할 예정 -> export가 맞을듯 일단 짧으면 해봄
                    console.log("매니저입니다"); //여기까지 완료
                    // transport 생성
                    nodemail.sendEmailmanager(userEmail, (error, info) => {
                      if (error) {
                          console.error("이메일 전송 실패:", error);
                      } else {
                          console.log("이메일 전송 성공:", info);
                      }
                    });
                  }
                }
            })
          }
        });
      });
      socket.on('approveReservation', (data) => {//클라이언트쪽에서 관리자의 승인이 넘어오면 db를 갱신하고 클라이언트에 반환 -> state가 200에서 210으로 바뀌는 느낌
        db.query(`UPDATE reserve SET space${data[4]} = ${data[3] + "10"} WHERE phone_num =  ${data[5]}`, function(err, row) {//세션정보에 담긴 번호를 가져옴 바로 DB에서
          if(err) {// Temp_Table 의 field1의 값이 'data2' 인 행의 field3의 값을 '변경된 값'으로 수정 해라.
            console.log(err);
          }
          db.query(`SELECT * FROM reserve WHERE phone_num = ${data[5]} AND space${data[4]} = ${data[3] + "10"}` , function(err, row) {//클라이언트쪽으로 넘길 자료 
              if(err) {                                                                         //이거 row에 그 번호에 따른 reserve에서 행들이 들어감
                console.log(err);
              }    
              if(row.length > 0) {                                  
                io.emit('approveReserve2', row[0]); //클라이언트에서도 이벤트이름 : approveReserve2
              }
          }); 
              //이거 그냥은 작동안함 -> update는 원래 row에 아무것도 반환해서 row가 null이기 때문 -> 따라서 비효율적이지만 또 query하는거임
        });
      });
      // 다른 소켓 이벤트 처리 - makeReservation말고 여러개 만들수 있음
      
      //웹소켓 연결 종료 시
      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });
    });
  };


  module.exports = {
    openreserve
}; 