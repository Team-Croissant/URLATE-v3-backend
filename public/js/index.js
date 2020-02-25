$(document).ready(() => {
  $.ajax({
    type: 'GET',
    url: `${api}/vaildCheck`,
    dataType: 'JSON',
    xhrFields: {
      withCredentials: true
    },
    complete: (data) => {
      console.log(data);
      if(data.responseJSON.result == "logined") {
        window.location.href = `${projectUrl}/game`;
      } else if(data.responseJSON.result == "Not authorized") {
        window.location.href = `${projectUrl}/authorize`;
      } else if(data.responseJSON.result == "Not registered") {
        window.location.href = `${projectUrl}/join`;
      }
    }
  });
});

window.onload = () => {
  document.getElementById('buttonContainer').style.transitionDuration = '2s';
  setTimeout(() => {
    document.getElementsByClassName('abcRioButtonContents')[0].getElementsByTagName("span")[1].innerHTML = document.getElementsByClassName('abcRioButtonContents')[0].getElementsByTagName("span")[0].innerHTML;
    document.getElementById('buttonContainer').style.marginTop = '2vh';
    document.getElementById('buttonContainer').style.opacity = '1';
  }, 500);
};

 $('#my-signin2').click(() => {
  auth2.grantOfflineAccess().then(signInCallback);
});

const signInCallback = (authResult) => {
  if (authResult['code']) {
    console.log(authResult['code']);
    $.ajax({
      type: 'POST',
      url: `${api}/login`,
      dataType: 'JSON',
      xhrFields: {
        withCredentials: true
      },
      data: {
        "ClientId" : "300804215392-fcv3uph5mscb39av0c4kk65gq8oupqrq.apps.googleusercontent.com",
        "ClientSecret" : "WVUB-PJDdwdm3dHpkOMbacqw",
        "RedirectionUrl" : `${projectUrl}`,
        "code" : authResult['code']
      },
      complete: (data) => {
        if(data.responseJSON.result == "logined") {
          window.location.href = `${projectUrl}/join`;
        } else if(data.responseJSON.result == "failed") {
          alert(loginFailed);
        }
      }
    });
  } else {
    alert(loginError);
  }
};
  

const signOut = () => {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(() => {
    console.log('User signed out.');
  });
};