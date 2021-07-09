document.addEventListener("DOMContentLoaded", (event) => {
  alert(
    "개발중인 서비스입니다.\n결제서비스 심사 관계자분이시라면, 비밀번호 확인 후 나오는 인게임 화면에서 '스토어'를 눌러 결제를 테스트할 수 있습니다.\n'스토어'에서의 테스트 이후, 메인화면에서 '멤버십'을 눌러 정기구독을 테스트할 수 있습니다.\n이 외 관계자분이시라면, 게임 내부를 전부 둘러보시면서 테스트를 진행할 수 있습니다."
  );
  fetch(`${api}/auth/status`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status == "Logined") {
        window.location.href = `${projectUrl}/game`;
      } else if (data.status == "Not registered") {
        window.location.href = `${projectUrl}/join`;
      } else if (data.status == "Not logined") {
        window.location.href = projectUrl;
      } else if (data.status == "Not authenticated") {
        window.location.href = `${projectUrl}/authentication`;
      } else if (data.status == "Not authenticated(adult)") {
        window.location.href = `${projectUrl}/authentication?adult=1`;
      } else if (data.status == "Shutdowned") {
        window.location.href = `${api}/auth/logout?redirect=true&shutdowned=true`;
      }
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
    });
});

const passReg = /^[0-9]{4,6}$/;

document.getElementById("password").addEventListener(
  "blur",
  (e) => {
    if (!passReg.test(document.getElementById("password").value)) {
      if (!document.getElementById("pw").classList[0]) {
        document.getElementById("pw").classList.toggle("show");
      }
    } else {
      if (document.getElementById("pw").classList[0]) {
        document.getElementById("pw").classList.toggle("show");
      }
    }
  },
  true
);

const check = () => {
  if (!passReg.test(document.getElementById("password").value)) {
    if (!document.getElementById("pw").classList[0]) {
      document.getElementById("pw").classList.toggle("show");
    }
  } else {
    if (document.getElementById("pw").classList[0]) {
      document.getElementById("pw").classList.toggle("show");
    }
    fetch(`${api}/auth/authorize`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        secondaryPassword: document.getElementById("password").value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result == "success") {
          window.location.href = `${projectUrl}/game`;
        } else if (data.result == "failed") {
          if (data.error == "Wrong Format") {
            if (!document.getElementById("pw").classList[0]) {
              document.getElementById("pw").classList.toggle("show");
            }
          } else if (data.error == "Wrong Password") {
            if (!document.getElementById("failed").classList[0]) {
              document.getElementById("failed").classList.toggle("show");
            } else {
              document.getElementById("failed").classList.toggle("show");
              setTimeout(() => {
                document.getElementById("failed").classList.toggle("show");
              }, 500);
            }
          } else {
            alert("Authorize Failed.");
          }
        }
      })
      .catch((error) => {
        alert(`Error occured.\n${error}`);
      });
  }
};

document.addEventListener("keydown", (event) => {
  if (event.code == "Enter") {
    check();
  }
});
