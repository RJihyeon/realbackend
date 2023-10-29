// Authentification에 관련된 함수들

const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// 유저 권한 확인 함수
// 여기서 userId는 id를 의미!!
// callback 함수의 두 번째 매개변수가 null -> 아이디 틀림, false -> 비밀번호 틀림
// 로그인이 성공했다면, {id: id, password: pw, phone_num: phone_num, student_id: student_id, name: name, affiliation: affiliation, division: divison} 형식의 객체를 콜백에 전달
function authenticateUser(userId, password, callback) {
    const query = 'SELECT * FROM users WHERE id = ? AND password = ?';
    comparePassword(userId, password, (err, result_password) => {
        const storedHashedPassword = result_password;
        const values = [userId, storedHashedPassword];
        // 아이디 혹은 비밀번호가 틀린경우 각각 storedHashedPassword가 null, false.
        if (!storedHashedPassword) {
            callback(null, storedHashedPassword);
        }
        else {
            db.query(query, values, (err, results) => {
                if (err) {
                    console.error('DB 쿼리문에서 오류:', err);
                    callback(err, null);
                } 
                else {
                    if (results.length == 1) {
                        // Authentication succeeded
                        // json data 형식 : {id: id, password: pw, phone_num: phone_num, student_id: student_id, name: name, affiliation: affiliation, division: divison} / 2023.09.26
                        const user = results[0];
                        callback(null, user);
                    }
                    else if (results.length == 0) {
                        // Authentication failed
                        console.error('일치하는 ID or PW가 없습니다', err);
                        callback(null, null);
                    }
                    // Database Error
                    else {
                        console.error('2개 이상의 중복된 ID, PW가 DB에 존재함:', err);
                        callback(err, null);
                    }
                }
            });
        }
    });
    
}

// 비밀번호가 맞으면 해시된 비밀번호를 콜백에 전달, 비밀번호가 틀렸으면 false 전달, 아이디가 틀렸으면(없거나 , 같은 아이디가 DB에 2개 이상 있으면) null 전달
function comparePassword(userId, userInputPassword, callback) {
    let storedHashedPassword;
    db.query('SELECT password FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('PW 확인 SQL 쿼리에서 오류 발생:', err);
        }
        else {
            storedHashedPassword = results;
            if (storedHashedPassword.length == 0) {
                console.log('없는 아이디입니다');
                callback(null, null);
            }
            else if (storedHashedPassword.length == 1) {
                // password를 비교한다
                bcrypt.compare(userInputPassword, storedHashedPassword[0].password, (err, result) => {
                    if (err) {
                    // 에러 처리
                    console.error('비밀번호 비교 오류:', err);
                    } 
                    else {
                        if (result) {
                            // 비밀번호 일치
                            console.log('비밀번호가 일치합니다.');
                            callback(null, storedHashedPassword[0].password);
                        } else {
                            // 비밀번호 불일치
                            console.log('비밀번호가 일치하지 않습니다.');
                            callback(null, false);
                        }
                    }
                });
            }
            else {
                console.log('DB에 같은 아이디가 2개 이상 존재합니다.');
                callback(null, null);
            }
        }
    });
    
    
    
}

// 회원가입 함수
function signup(query, values, callback) {
    db.query(query, values, (err, results) => {
        if (err) {
          console.error('인증 오류:', err);
          callback(err, null);
        } 
        else {
            console.log('회원가입 완료');
            // null, null 전달될 경우 --> 회원가입 성공으로 간주하고 로그인 페이지로 넘어가도록 하자
            callback(null, null);
        }
    });
}

function changetonew(query, callback) {
    db.query(query, (err, results) => {
        if (err) {
          console.error('인증 오류:', err);
          callback(err, null);
        } 
        else {
            console.log('비밀번호 변경 완료');
            // null, null 전달될 경우 --> 회원가입 성공으로 간주하고 로그인 페이지로 넘어가도록 하자
            callback(null, null);
        }
    });
}

function findid(username, userstudent_id, callback) {
    const valuesf = [username, userstudent_id];
    const v = "'" + valuesf[0] + "'";//이게 한글 인식을 못해서 쿼리할 때 근데 이러면 또 됨 왜 한글만 ''붙여야되지? -> 문자열인식때매 그런가
    db.query(`SELECT * FROM users WHERE name = ${v} AND student_id = ${valuesf[1]}`, (err, results) => {
        if (err) {
            console.error('DB 쿼리문에서 오류:', err);
            callback(err, null);
        } 
        else {
            if (results.length == 1) {
                // Authentication succeeded
                // json data 형식 : {id: id, password: pw, phone_num: phone_num, student_id: student_id, name: name, affiliation: affiliation, division: divison} / 2023.09.26
                const user = results[0];
                callback(null, user);
            }
            else if (results.length == 0) {
                // Authentication failed
                console.error('일치하는 정보가 없습니다', err);
                callback(null, null);
            }
            // Database Error
            else {
                console.error('2개 이상의 중복된 ID, PW가 DB에 존재함:', err);
                callback(err, null);
            }
        }
    });
}

function findpw(userid, userstudent_id, callback) {
    const values = [userid, userstudent_id];
    db.query('SELECT * FROM users WHERE id = ? AND student_id = ?', values, (err, results) => {
        if (err) {
            console.error('DB 쿼리문에서 오류:', err);
            callback(err, null);
        } 
        else {
            if (results.length == 1) {
                // Authentication succeeded
                // json data 형식 : {id: id, password: pw, phone_num: phone_num, student_id: student_id, name: name, affiliation: affiliation, division: divison} / 2023.09.26
                const user = results[0];
                callback(null, user);
            }
            else if (results.length == 0) {
                // Authentication failed
                console.error('일치하는 아이디정보가 없습니다', err);
                callback(null, null);
            }
            // Database Error
            else {
                console.error('2개 이상의 중복된 ID, PW가 DB에 존재함:', err);
                callback(err, null);
            }
        }
    });
}


// 주기적인 세션 정리 함수
function cleanExpiredSessions() {
    const now = new Date().getTime();
    app.sessionStore.all((error, sessions) => {
        if (error) {
            console.error('세션 검색 오류:', error);
            return;
        }
  
        // 세션 데이터를 반복하여 검사
        for (const sessionId in sessions) {
            const sessionData = JSON.parse(sessions[sessionId]);
            if (sessionData.cookie.expires <= now) {
            // 만료된 세션 삭제
            app.sessionStore.destroy(sessionId, (error) => {
                if (error) {
                console.error('세션 삭제 오류:', error);
                } else {
                console.log('만료된 세션 삭제:', sessionId);
                }
            });
            }
        }
    });
}
  
module.exports = {
    authenticateUser,
    cleanExpiredSessions,
    signup,
    comparePassword,
    findid,
    findpw,
    changetonew
}; 