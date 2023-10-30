const nodemailer = require("nodemailer");

// 본인 Gmail 계정
const EMAIL = "k591180809@gmail.com";//너 이메일
const EMAIL_PW = "fjbg wxyb shaj hkzt";//너 비번 -> 앱 비밀번호로 해야함 - 이거 총동연 계정으로 함

// transport 생성
const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL,
        pass: EMAIL_PW,
    },
});

const link = "http://localhost:3000/changepw.html"; // 링크 URL 로컬임

    // HTML 형식의 이메일 본문 생성 -> 좀더 이쁘게 해야지
const htmlBody = `
    <p>안녕하세요.</p>
    <p>비밀번호 변경을 위해 다음 링크를 클릭하세요: <a href="${link}">비밀번호 변경</a></p>
`;

function sendEmail(receiverEmail, callback) {
    // 전송할 email 내용 작성
    const mailOptions = {
        from: EMAIL,
        to: receiverEmail,
        subject: "비밀번호 변경 안내입니다.",
        html: htmlBody,
    };

    // email 전송
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            callback(error, null);
        } else {
            console.log(info);
            console.log("send mail success!");
            callback(null, info);
        }
    });
}

function sendEmailmanager(receiverEmail, callback) {
    // 전송할 email 내용 작성
    const mailOptions = {
        from: EMAIL,
        to: receiverEmail,
        subject: "예약취소 안내입니다.",
        text: "귀하의 예약이 취소됨을 알려드립니다.",
    };

    // email 전송
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            callback(error, null);
        } else {
            console.log(info);
            console.log("send mail success!");
            callback(null, info);
        }
    });
}

module.exports = {
    sendEmail,
    sendEmailmanager
};
