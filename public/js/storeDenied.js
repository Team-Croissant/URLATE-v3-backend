let lottieAnim = bodymovin.loadAnimation({
  wrapper: animContainer,
  animType: 'canvas',
  loop: false,
  path: 'lottie/fail.json'
});

document.addEventListener("DOMContentLoaded", (event) => {
  setInterval(() => {
    infoSecondText.textContent = infoSecondText.textContent - 1;
    if(infoSecondText.textContent == 0) {
      window.location.href = `${url}/game`;
    }
  }, 1000);
});