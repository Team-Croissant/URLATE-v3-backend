const canvas = document.getElementById('componentCanvas');
const ctx = canvas.getContext("2d");
let pattern = {};
let userName = '';
let settings, sync, song;

function getParam(sname) {
  let params = location.search.substr(location.search.indexOf("?") + 1);
  let sval = "";
  params = params.split("&");
  for (let i = 0; i < params.length; i++) {
      temp = params[i].split("=");
      if ([temp[0]] == sname) { sval = temp[1]; }
  }
  return sval;
}

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${api}/getStatus`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.status == "Not authorized") {
      window.location.href = `${url}/authorize`;
    } else if(data.status == "Not registered") {
      window.location.href = `${url}/join`;
    } else if(data.status == "Not logined") {
      window.location.href = url;
    } else {
      fetch(`${api}/getUser`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => res.json())
      .then((data) => {
        if(data.result == 'success') {
          userName = data.nickname;
          settings = JSON.parse(data.settings);
          settingApply();
        } else {
          alert(`Error occured.\n${data.description}`);
        }
      }).catch((error) => {
        alert(`Error occured.\n${error}`);
      });
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
  fetch(`${api}/getTracks`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.result == 'success') {
      /*song = new Howl({
        src: [`${cdn}/tracks/${settings.sound.quality}/${tracks[songSelectBox.selectedIndex].fileName}.mp3`],
        autoplay: false,
        loop: false,
        onend: () => {
          song.stop();
        },
        onload: () => {
        }
      });*/
    } else {
      alert('Failed to load song list.');
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
  initialize();
});

const initialize = () => {
  pattern = JSON.parse(decodeURI(getParam('pattern')));
  canvas.width = window.innerWidth;
  ctx.height = window.innerHeight;
};

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
  sync = parseInt(settings.sound.offset);
};