const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
const passReg = /^[0-9]{4,6}$/;

$("#nickname").blur(() => {
    if(!nameReg.test($("#nickname").val())) {
        $("#name").fadeIn(500);
    } else {
        $("#name").fadeOut(500);
    }
});

$("#password").blur(() => {
    if(!passReg.test($("#password").val())) {
        $("#pw").fadeIn(500);
    } else {
        $("#pw").fadeOut(500);
    }
});

function check() {
    if(!nameReg.test($("#nickname").val())) {
        $("#name").fadeIn(500);
    } else {
        $("#name").fadeOut(500);
        if(!passReg.test($("#password").val())) {
            $("#pw").fadeIn(500);
        } else {
            $("#pw").fadeOut(500);
        }
    }
}