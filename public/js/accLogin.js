document.addEventListener("DOMContentLoaded", (event) => {
  fetch(`${api}/auth/status`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status == "Logined") {
        window.location.href = `${projectUrl}/game`;
      } else if (data.status == "Not authorized") {
        window.location.href = `${projectUrl}/authorize`;
      } else if (data.status == "Not registered") {
        window.location.href = `${projectUrl}/join`;
      } else if (data.status == "Not authenticated") {
        window.location.href = `${projectUrl}/authentication`;
      }
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
    });
});

const userReg = /^[a-z0-9]{1,10}$/;
const passReg = /^[a-zA-Z0-9!]{10}$/;

const submit = () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (userReg.test(username)) {
    if (passReg.test(password)) {
      fetch(`${api}/acc/login`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          username: username,
          password: password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result == "success") {
            window.location.href = `${projectUrl}/game`;
          } else {
            alert("인증 실패, 데이터를 확인해주세요.");
          }
        });
      return;
    }
  }
  alert("잘못 입력된 데이터가 있습니다.");
};
