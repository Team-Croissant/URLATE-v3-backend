let lottieAnim;

document.addEventListener("DOMContentLoaded", async (event) => {
  await fetch(`${api}/danal/final`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result == "failed") {
        if (data.error == "Exist person") {
          alert(personAlert);
          window.location.href = `${api}/auth/logout?redirect=true`;
          return;
        }
        window.location.href = `${url}/authentication/failed`;
      }
      lottieAnim = bodymovin.loadAnimation({
        wrapper: animContainer,
        animType: "canvas",
        loop: false,
        path: "/lottie/check.json",
      });
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
    });
  setInterval(() => {
    infoSecondText.textContent = infoSecondText.textContent - 1;
    if (infoSecondText.textContent == 0) {
      window.location.href = `${url}/authorize`;
    }
  }, 1000);
});
