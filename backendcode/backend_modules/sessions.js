// Sessions 관련 라우터들

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require('body-parser');
const path = require('path');
const mysqlSession = require('express-mysql-session')(session);
const db = require('./db');
const nodemail = require('./node_email');
const auth_functions = require('./auth_functions');

const router = express.Router();

// body-parser 미들웨어 등록
router.use(bodyParser.urlencoded({ extended: false })); // application/x-www-form-urlencoded 데이터 파싱
router.use(bodyParser.json()); // application/json 데이터 파싱

var options = {
    host : 'localhost',
    port : 3306,
    user : 'root',
    password : '1234',
    database : 'authtest'
  };
  
var sessionStore = new mysqlSession(options);



// 세션 설정
router.use(
  session({
    key : 'login123',           // It's just a name of session issued to client. Not used in server-side.
    secret: 'my key',           // Secret key used to encoding session data. It should be unpredictable and random key.
    resave: false,              // Whether to resave unchanged sessions.
    store: sessionStore,
    saveUninitialized: false,   // Whether to save uninitialized sessions. For server efficiency, two options are set to false.
    cookie : {
        maxAge : 1000 * 60 * 60,                    // 클라이언트에 저장되는 세션의 유지 시간
        expires: new Date(Date.now() + 1000 * 60 * 60),     // 서버에 저장되는 세션의 만료 기한 --> 주기적으로 만료된 세션 정보를 서버에서 자동 파괴시키도록 함수 구현
    },
  })
);

// 라우트 핸들러 - 로그인
router.post('/login', (req, res) => {
    // 클라에서 id, password 형식으로 전달받아야 합니다.
    const id = req.body.id;
    const password = req.body.password;
    // 모듈을 활용하여 DB로부터 로그인 정보가 올바른지 확인
    console.log('id:', id, 'password:', password); //이거 없애야함 결국엔
    auth_functions.authenticateUser(id, password, (err, results) => {
        // 로그인 성공 시 세션에 DB에 있는 pw를 제외한 모든 정보 저장. 추후 꺼내 쓰도록 하자.
        if (results != null) {
            const userId = results.id;
            const phone_num = results.phone_num;
            const student_id = results.student_id;
            const userName = results.name;
            const affiliation = results.affiliation;
            const division = results.division;
            
            const userData = {userId: userId, phone_num: phone_num, student_id: student_id, userName: userName, affiliation: affiliation, division: division};
            req.session.user = userData;

            // 로그인 성공 시 위의 정보를 client에도 전송한다.
            console.log('로그인 성공');
            const responseData = JSON.stringify(userData);
            // res.status(200).json(responseData); -> 이거 지금은 내가 그냥 main으로 direct하고 있긴한데 사실 client에서 바꿔야될듯
            res.redirect('/main.html');
        }
        else {
            // 로그인 실패 시 실패했다고 client에 전송한다.
            res.status(401).send("Unauthorized Login");
        }
    })
});

// 회원가입
router.post('/signup', (req, res) => {
    let info = [req.body.id, req.body.password, req.body.phone_num, req.body.student_id, req.body.name,
        req.body.affiliation, req.body.division, req.body.email];

    // password를 해싱한다.
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            console.error('솔트 생성 오류:', err);
        } 
        else {
            bcrypt.hash(info[1], salt, (err, hash) => {
            if (err) {
                console.error('해싱 오류:', err);
            } 
            // 회원가입 로직
            else {
                // req에서 사용자가 입력한 비밀번호를 해싱하여 info의 정보를 바꾼다.
                info[1] = hash;
                const query = 'INSERT INTO users(id, password, phone_num, student_id, name, affiliation, division, email) VALUE(?,?,?,?,?,?,?,?)';
                auth_functions.signup(query, info, (err, results) => {
                    // 조건 : 둘다 null인 건 signup에 성공하여 유저의 정보가 DB에 전송됐음을 의미한다.
                    if (err === null && results === null) {
                        res.redirect('/login.html');
                    }
                    // 왠지는 모르지만 signup 실패
                    else {
                        res.redirect('/signup.html');
                    }
                })
            }
        });
        }
    });
});

router.post('/findid', (req, res) => {
    // 아이디 찾기
    let info = [req.body.name, req.body.student_id];    
    auth_functions.findid(info[0], info[1], (err, results) => {
        if (results != null) {
            const userIdf = results.id;
            const userDataf = {userId: userIdf};
            console.log('아이디 찾기 성공');
            const responseData = JSON.stringify(userDataf);
            //여기로 id만 보냄
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(responseData);
        }
        else {
            // 찾기 실패 시 실패했다고 client에 전송한다.
            res.status(401).send("Unauthorized find");
        }
    })
});

router.post('/findpw', (req, res) => {
    // 비번 찾기
    let info = [req.body.id, req.body.student_id];    
    auth_functions.findpw(info[0], info[1], (err, results) => {
        // 로그인 성공 시 세션에 DB에 있는 pw를 제외한 모든 정보 저장. 추후 꺼내 쓰도록 하자.
        if (results != null) {
            var userEmail = req.body.email;
            // 로그인 성공 시 위의 정보를 client에도 전송한다.
            console.log('비번 초기화 시작');
            //여기서 email 전송하면 끝
            nodemail.sendEmail(userEmail, (error, info) => {
                if (error) {
                    console.error("이메일 전송 실패:", error);
                } else {
                    console.log("이메일 전송 성공:", info);
                }
            });
            res.status(200).send(`<button onclick="location.href='login.html'">로그인으로 복귀</button >
            <script>window.alert('이메일이 전송되었으니 확인해주세요');</script>`)//당연히 바꿀거임
        }
        else {
            // 로그인 실패 시 실패했다고 client에 전송한다.
            res.status(401).send("Unauthorized Login");
        }
    })
});

// 비밀번호 변경
router.post('/changepw', (req, res) => {
    const info = [req.body.id, req.body.password];
    // password를 해싱한다.
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            console.error('솔트 생성 오류:', err);
        } 
        else {
            bcrypt.hash(info[1], salt, (err, hash) => {
            if (err) {
                console.error('해싱 오류:', err);
            } 
            // 비번 찾기
            else {
                // req에서 사용자가 입력한 비밀번호를 해싱하여 info의 정보를 바꾼다.
                const newhash = "'" + hash + "'";
                const query = `UPDATE users SET password = ${newhash} WHERE id = ${info[0]}`;
                
                auth_functions.changetonew(query,(err, results) => {
                    // 조건 : 둘다 null인 건 성공하여 유저의 정보가 DB에 전송됐음을 의미한다.
                    if (err === null && results === null) {
                        res.redirect('/login.html');
                    }
                    // 왠지는 모르지만 실패
                    else {
                        res.redirect('/login.html');
                    }
                })
            }
        });
        }
    });
});


    // 로그아웃
router.get('/logout', (req, res) => {
// 세션을 파기하고 로그아웃
    req.session.destroy((err) => {
        if (err) {
        console.error('세션 파기 오류:', err);
        res.status(500).send('세션 파기 오류');
        } 
        else {
        // 로그아웃 성공
        res.redirect('/login.html');
        }
    });
});

// 세션에 저장된 유저 정보 요청
router.post('/get_user_info', (req, res) => {
    // 서버에 세션 정보가 남아 있다면, 유저정보를 클라로 전송
    if (req.session.user) {
        const userData = req.session.user;
        const responseData = JSON.stringify(userData);
        res.status(200).json(responseData);
    }
    // 세션이 만료되었거나 로그인 상태가 아님
    else {
        res.status(401).send("No session exists");
    }
});

router.route('/reserve').get(
    function(req, res) {
      console.log('/reserve 라우팅 함수호출 됨');
      const filePath = path.join(__dirname, '..', 'public', 'reserve.html');
      res.sendFile(filePath);
    }
  );

module.exports = router;