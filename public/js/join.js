window.onload = function() {
    $.ajax({
        type: 'GET',
        url: `${api}/vaildCheck`,
        dataType: 'JSON',
        xhrFields: {
          withCredentials: true
        },
        success: function(data){
            if(data.result == "logined") {
                window.location.href = `${projectUrl}/game`;
            } else if(data.result == "Not authorized") {
                window.location.href = `${projectUrl}/authorize`;
            } else if(data.result == "Not logined") {
                window.location.href = `${projectUrl}`;
            }
        }
    });
};

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
                success: function(data){
                  if(data.result == "registered") {
                    window.location.href = `${projectUrl}/authorize`;
                  } else if(data.result == "failed") {
                    alert("join failed.");
                    console.log(data);
                  }
                }
            });
        }
    }
}

document.addEventListener('keydown', function(event) {
    if(event.code == 'Enter') {
        check();
    }
});