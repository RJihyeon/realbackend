const express = require('express');
const http = require('http');
const serveStatic = require('serve-static');      //특정 폴더의 파일들을 특정 패스로 접근할 수 있도록 열어주는 역할
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2');
const bcrypt = require('bcrypt'); //비밀번호 암호화를 위한 역할
const session = require('express-session');
const mysqlSession = require('express-mysql-session')(session);
const cors = require('cors');
let bodyParser_post = require('body-parser');       //post 방식 파서
const socketIo = require('socket.io');//서버 연결

let app = express();      //express 서버 객체

// 모듈 연결
const auth_functions = require('./backend_modules/auth_functions');
const sessionRouter = require('./backend_modules/sessions');
const reservationModule = require('./reserve.js'); //-> 예약 함수 일단 연결

// 라우트 등록
app.use('/', sessionRouter);

app.set('port', 3000);

//미들웨어들 등록 시작, 아래 미들웨어들은 내부적으로 next() 가실행됨

//join은 __dirname : 현재 .js 파일의 path 와 public 을 합친다
//이렇게 경로를 세팅하면 public 폴더 안에 있는것을 곧바로 쓸 수 있게된다
app.use(serveStatic(path.join(__dirname, 'public')));


//post 방식 일경우 begin
//post 의 방식은 url 에 추가하는 방식이 아니고 body 라는 곳에 추가하여 전송하는 방식
app.use(bodyParser_post.urlencoded({ extended: false }));            // post 방식 세팅
app.use(bodyParser_post.json()); // json 사용 하는 경우의 세팅


//post 방식 일경우 end


//CORS 오류 해결
app.use(cors({
    origin : true,
    credentials : true
}));


//라우트를 미들웨어에 등록하기 전에 라우터에 설정할 경로와 함수를 등록한다
//
//라우터를 사용 (특정 경로로 들어오는 요청에 대하여 함수를 수행 시킬 수가 있는 기능을 express 가 제공해 주는것)
let router = express.Router();

router.route('/process/main').get(
    function (req, res) {
        console.log('/process/main  라우팅 함수 실행');

        //세션정보는 req.session 에 들어 있다
        if (req.session.user)       //세션에 유저가 있다면
        {   
            console.log('세션있음');
            res.redirect("/main.html");
        }
        else {
            console.log('세션없음');
            res.redirect('/login.html');
        }
    }
);
  


//라우터 미들웨어 등록하는 구간에서는 라우터를 모두  등록한 이후에 다른 것을 세팅한다
//그렇지 않으면 순서상 라우터 이외에 다른것이 먼저 실행될 수 있다

app.use('/', router);       //라우트 미들웨어를 등록한다


app.all('*',
    function (req, res) {
        res.status(404).send('<h1> 요청 페이지 없음 </h1>');
    }
);

// 1시간마다 서버 측에서 만료된 세션 파괴
setInterval(auth_functions.cleanExpiredSessions, 60 * 60 * 1000);

//웹서버를 app 기반으로 생성
var appServer = http.createServer(app);
appServer.listen(app.get('port'),
    function () {
        console.log('http://localhost:' + app.get('port') + '/process/main');
    }
);
const io = socketIo(appServer);
// 예약 기능 모듈 사용

reservationModule.openreserve(io);

