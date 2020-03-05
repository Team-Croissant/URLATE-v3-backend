document.addEventListener("DOMContentLoaded", (event) => {
  fetch(`${api}/getStatus`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.result == "logined") {
      window.location.href = `${projectUrl}/game`;
    } else if(data.result == "Not authorized") {
      window.location.href = `${projectUrl}/authorize`;
    } else if(data.result == "Not registered") {
      window.location.href = `${projectUrl}/join`;
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
});

window.onload = () => {
  document.getElementById('buttonContainer').style.transitionDuration = '2s';
  setTimeout(() => {
    try {
      document.getElementsByClassName('abcRioButtonContents')[0].getElementsByTagName("span")[1].innerHTML = document.getElementsByClassName('abcRioButtonContents')[0].getElementsByTagName("span")[0].innerHTML;
    } catch (e) {
      console.log(e);
    }
    document.getElementById('buttonContainer').style.marginTop = '2vh';
    document.getElementById('buttonContainer').style.opacity = '1';
  }, 500);
};

const loginTrigger = () => {
  auth2.grantOfflineAccess().then(signInCallback);
};

const signInCallback = (authResult) => {
  if (authResult['code']) {
    fetch(`${api}/login`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        ClientId : "300804215392-fcv3uph5mscb39av0c4kk65gq8oupqrq.apps.googleusercontent.com",
        ClientSecret : "WVUB-PJDdwdm3dHpkOMbacqw",
        RedirectionUrl : `${projectUrl}`,
        code : authResult['code']
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then((data) => {
      if(data.result == "logined") {
        window.location.href = `${projectUrl}/join`;
      } else if(data.result == "failed") {
        alert(loginFailed);
      }
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
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