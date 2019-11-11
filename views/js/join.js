const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
const passReg = /^[0-9]{4}$/;

$("#nickname").blur(() => {
    if(!nameReg.test($("#nickname").val())) {
        alert("닉네임(별명)은 5글자에서 12글자의 문자열(A-Z, a-z, _, -)로 이루어져야 합니다.");
        $("#name").fadeIn(500);
    } else {
        $("#name").fadeOut(500);
    }
});

$("#password").blur(() => {
    if(!passReg.test($("#password").val())) {
        alert("2차 비밀번호는 0부터 9까지의 숫자 4자리로 이루어져야 합니다.");
        $("#pw").fadeIn(500);
    } else {
        $("#pw").fadeOut(500);
    }
});