$(document).ready(() => {
    $.ajax({
        type: 'GET',
        url: `${api}/vaildCheck`,
        dataType: 'JSON',
        xhrFields: {
          withCredentials: true
        },
        complete: (data) => {
            if(data.responseJSON.result == "logined") {
                window.location.href = `${projectUrl}/game`;
            } else if(data.responseJSON.result == "Not authorized") {
                window.location.href = `${projectUrl}/authorize`;
            } else if(data.responseJSON.result == "Not logined") {
                window.location.href = `${projectUrl}`;
            }
        }
    });
});

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

const check = () => {
    if(!nameReg.test($("#nickname").val())) {
        $("#name").fadeIn(500);
    } else {
        $("#name").fadeOut(500);
        if(!passReg.test($("#password").val())) {
            $("#pw").fadeIn(500);
        } else {
            $("#pw").fadeOut(500);
            $.ajax({
                type: 'POST',
                url: `${api}/join`,
                dataType: 'JSON',
                xhrFields: {
                  withCredentials: true
                },
                data: {
                    "displayName": $('#nickname').val(),
                    "secondaryPassword": $('#password').val()
                },
                complete: (data) => {
                  if(data.responseJSON.result == "registered") {
                    window.location.href = `${projectUrl}/authorize`;
                  } else if(data.responseJSON.result == "failed") {
                    alert("join failed.");
                    console.log(data);
                  }
                }
            });
        }
    }
};

document.addEventListener('keydown', (event) => {
    if(event.code == 'Enter') {
        check();
    }
});