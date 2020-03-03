document.addEventListener("DOMContentLoaded", (event) => {
    fetch(`${api}/vaildCheck`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then((data) => {
      if(data.result == "logined") {
        window.location.href = `${projectUrl}/game`;
      } else if(data.result == "Not registered") {
        window.location.href = `${projectUrl}/join`;
      } else if(data.result == "Not logined") {
        window.location.href = projectUrl;
      }
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
    });
  });

const passReg = /^[0-9]{4,6}$/;

document.getElementById('password').addEventListener("blur", (e) => {
    if(!passReg.test(this.value)) {
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
        fetch(`${api}/authorize`, {
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
              if(data.result == "authorized") {
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