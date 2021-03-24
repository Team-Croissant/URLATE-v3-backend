let lottieAnim;

document.addEventListener("DOMContentLoaded", (event) => {
  let UserAgent = navigator.userAgent;
  console.log(UserAgent);
	if(UserAgent.match(/iPhone|iPod|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null || (UserAgent.match(/Safari/i) != null && UserAgent.match(/Chrome/i) == null))	{
		fullscreenRequired.style.display = 'none';
	}
  let widthWidth = window.innerWidth;
  let heightWidth = window.innerHeight / 9 * 16;
  if(widthWidth > heightWidth) {
    animContainer.style.width = `${widthWidth}px`;
    animContainer.style.height = `${widthWidth / 16 * 9}px`;
  } else {
    animContainer.style.width = `${heightWidth}px`;
    animContainer.style.height = `${heightWidth / 16 * 9}px`;
  }
  lottieAnim = bodymovin.loadAnimation({
    wrapper: animContainer,
    animType: 'canvas',
    loop: true,
    path: 'lottie/index.json'
  });
  lottieAnim.addEventListener('DOMLoaded', () => {
    canvasResize();
  });
  lottie.setSpeed(0.5);
  fetch(`${api}/auth/status`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.status == "Logined") {
      window.location.href = `${projectUrl}/game`;
    } else if(data.status == "Not authorized") {
      window.location.href = `${projectUrl}/authorize`;
    } else if(data.status == "Not registered") {
      window.location.href = `${projectUrl}/join`;
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
});

/*const mouseMove = (e) => {
  lottie.pause();
  animContainer.getElementsByTagName('canvas')[0].style.marginRight = `${50 + (e.clientX - (window.innerWidth / 2)) / (window.innerWidth / 2) * 50}px`;
  animContainer.getElementsByTagName('canvas')[0].style.marginBottom = `${50 + (e.clientY - (window.innerHeight / 2)) / (window.innerHeight / 2) * 50}px`;
  lottie.play();
};*/

const canvasResize = () => {
  let widthWidth = window.innerWidth;
  let heightWidth = window.innerHeight / 9 * 16;
  if(widthWidth > heightWidth) {
    animContainer.style.width = `${widthWidth}px`;
    animContainer.style.height = `${widthWidth / 16 * 9}px`;
  } else {
    animContainer.style.width = `${heightWidth}px`;
    animContainer.style.height = `${heightWidth / 16 * 9}px`;
  }
  let lottieCanvas = animContainer.getElementsByTagName('canvas')[0];
  widthWidth = window.innerWidth * window.devicePixelRatio;
  heightWidth = window.innerHeight * window.devicePixelRatio / 9 * 16;
  if(widthWidth > heightWidth) {
    lottieCanvas.width = widthWidth;
    lottieCanvas.height = widthWidth / 16 * 9;
  } else {
    lottieCanvas.width = heightWidth;
    lottieCanvas.height = heightWidth / 16 * 9;
  }
  lottieAnim.destroy();
  lottieAnim = bodymovin.loadAnimation({
    wrapper: animContainer,
    animType: 'canvas',
    loop: true,
    path: 'lottie/index.json'
  });
}

window.onresize = () => {
  canvasResize();
};

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

const fullscreenDisable = () => {
  fullscreenRequired.style.display = 'none';
};

const loginTrigger = () => {
  auth2.grantOfflineAccess().then(signInCallback);
};

const signInCallback = (authResult) => {
  if (authResult['code']) {
    fetch(`${api}/auth/login`, {
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
      if(data.result == "success") {
        window.location.href = `${projectUrl}/authorize`;
      } else if(data.result == "failed") {
        if(data.error == "Not Whitelisted") {
          alert("You are not whitelisted.");
        } else {
          alert(loginFailed);
        }
      }
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
    });
  } else {
    alert(loginError);
  }
};