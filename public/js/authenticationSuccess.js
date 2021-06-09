let lottieAnim = bodymovin.loadAnimation({
  wrapper: animContainer,
  animType: "canvas",
  loop: false,
  path: "/lottie/check.json",
});

document.addEventListener("DOMContentLoaded", async (event) => {
  await fetch(`${api}/danal/final`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result == "failed") {
        window.location.href = `${url}/authentication/failed`;
      }
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
