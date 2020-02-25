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
            } else if(data.responseJSON.result == "Not logined") {
                window.location.href = `${projectUrl}`;
            } else if(data.responseJSON.result == "Not registered") {
                window.location.href = `${projectUrl}/join`;
            }
        }
    });
});

const passReg = /^[0-9]{4,6}$/;

$("#password").blur(() => {
    if(!passReg.test($("#password").val())) {
        $("#pw").fadeIn(500);
    } else {
        $("#pw").fadeOut(500);
    }
});

const check = () => {
    if(!passReg.test($("#password").val())) {
        $("#pw").fadeIn(500);
    } else {
        $("#pw").fadeOut(500);
        $.ajax({
            type: 'POST',
            url: `${api}/authorize`,
            dataType: 'JSON',
            xhrFields: {
              withCredentials: true
            },
            data: {
                "secondaryPassword": $('#password').val()
            },
            complete: (data) => {
                console.log(data);
              if(data.responseJSON.result == "authorized") {
                window.location.href = `${projectUrl}/game`;
              } else if(data.responseJSON.result == "failed") {
                if(data.error == "Wrong Format") {
                    $("#pw").fadeIn(500);
                } else if(data.responseJSON.error == "Wrong Password") {
                    $("#failed").fadeOut(500, () => {
                        $("#failed").fadeIn(500);
                    });
                } else {
                    alert("Authorize Failed.");
                }
              }
            }
        });
    }
};

document.addEventListener('keydown', (event) => {
    if(event.code == 'Enter') {
        check();
    }
});