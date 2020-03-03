document.addEventListener("DOMContentLoaded", (event) => {
    fetch(`${api}/vaildCheck`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then((data) => {
      if(data.result == "logined") {
        window.location.href = `${projectUrl}/game`;
      } else if(data.result == "Not authorized") {
        window.location.href = `${projectUrl}/authorize`;
      } else if(data.result == "Not logined") {
        window.location.href = projectUrl;
      }
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
    });
  });

const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
const passReg = /^[0-9]{4,6}$/;

document.getElementById('nickname').addEventListener("blur", (e) => {
    if(!nameReg.test(this.value)) {
        console.log('hi');
        if(!document.getElementById('name').classList[0]) {
            document.getElementById('name').classList.toggle("show");
        }
    } else {
        console.log('hello');
        if(document.getElementById('name').classList[0]) {
            document.getElementById('name').classList.toggle("show");
        }
    }   
}, true);

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
    if(!nameReg.test(document.getElementById('nickname').value)) {
        if(!document.getElementById('name').classList[0]) {
            document.getElementById('name').classList.toggle("show");
        }
    } else {
        if(document.getElementById('name').classList[0]) {
            document.getElementById('name').classList.toggle("show");
        }
        if(!passReg.test(document.getElementById('password').value)) {
            if(!document.getElementById('pw').classList[0]) {
                document.getElementById('pw').classList.toggle("show");
            }
        } else {
            if(document.getElementById('pw').classList[0]) {
                document.getElementById('pw').classList.toggle("show");
            }
            fetch(`${api}/join`, {
              method: 'POST',
              credentials: 'include',
              body: JSON.stringify({
                displayName: document.getElementById('nickname').value,
                secondaryPassword: document.getElementById('password').value
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then(res => res.json())
            .then((data) => {
                if(data.result == "registered") {
                    window.location.href = `${projectUrl}/authorize`;
                } else if(data.result == "failed") {
                    alert("join failed.");
                    console.log(data);
                }
            }).catch((error) => {
                alert(`Error occured.\n${error}`);
            });
        }
    }
};

document.addEventListener('keydown', (event) => {
    if(event.code == 'Enter') {
        check();
    }
});