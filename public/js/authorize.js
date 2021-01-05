document.addEventListener("DOMContentLoaded", (event) => {
    fetch(`${api}/auth/status`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then((data) => {
      if(data.status == "Logined") {
        window.location.href = `${projectUrl}/game`;
      } else if(data.status == "Not registered") {
        window.location.href = `${projectUrl}/join`;
      } else if(data.status == "Not logined") {
        window.location.href = projectUrl;
      }
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
    });
});

const passReg = /^[0-9]{4,6}$/;

document.getElementById('password').addEventListener("blur", (e) => {
    if(!passReg.test(document.getElementById('password').value)) {
        if(!document.getElementById('pw').classList[0]) {
            document.getElementById('pw').classList.toggle("show");
        }
    } else {
        if(document.getElementById('pw').classList[0]) {
            document.getElementById('pw').classList.toggle("show");
        }
    }   
}, true);

const check = () => {
    if(!passReg.test(document.getElementById('password').value)) {
        if(!document.getElementById('pw').classList[0]) {
            document.getElementById('pw').classList.toggle("show");
        }
    } else {
        if(document.getElementById('pw').classList[0]) {
            document.getElementById('pw').classList.toggle("show");
        }
        fetch(`${api}/auth/authorize`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                secondaryPassword: document.getElementById('password').value
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(res => res.json())
          .then((data) => {
              if(data.result == "success") {
                  window.location.href = `${projectUrl}/game`;
              } else if(data.result == "failed") {
                if(data.error == "Wrong Format") {
                    if(!document.getElementById('pw').classList[0]) {
                        document.getElementById('pw').classList.toggle("show");
                    }
                } else if(data.error == "Wrong Password") {
                    if(!document.getElementById('failed').classList[0]) {
                        document.getElementById('failed').classList.toggle("show");
                    } else {
                        document.getElementById('failed').classList.toggle("show");
                        setTimeout(() => {
                            document.getElementById('failed').classList.toggle("show");
                        }, 500);
                    }
                } else {
                    alert("Authorize Failed.");
                }
              }
          }).catch((error) => {
              alert(`Error occured.\n${error}`);
          });
    }
};

document.addEventListener('keydown', (event) => {
    if(event.code == 'Enter') {
        check();
    }
});