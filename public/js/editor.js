let isMenuOpened = false;
let isFileOpenerOpened = false;
let pattern = {};
let songName = '';

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
};

document.addEventListener("DOMContentLoaded", (event) => {
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
});

const menu = () => {
  if(isMenuOpened) {
    document.getElementById("menu").style.display = 'none';
    isMenuOpened = false;
  } else {
    if(isFileOpenerOpened) {
      document.getElementById("fileOpener").style.display = 'none';
      isFileOpenerOpened = false;
    } else {
      document.getElementById("menu").style.display = 'block';
      isMenuOpened = true;
    }
  }
};

const exit = () => {
  if(window.confirm(rusure)) {
    window.location.href = `${url}/game`;
  }
};

const load = () => {
  document.getElementById("menu").style.display = 'none';
  isMenuOpened = false;
  document.getElementById("fileOpener").style.display = 'block';
  isFileOpenerOpened = true;
};

const fileUploaded = (patternFile) => {
  document.getElementById("fileOpener").style.display = 'none';
  isFileOpenerOpened = false;
  patternFile = patternFile.files[0];
  parsePattern(patternFile); //TODO:PARSE JSON PATTERN FILE AND SHOW
};

const save = () => {
  var a = document.createElement("a");
  var file = new Blob([JSON.stringify(pattern)], {type: 'application/json'});
  a.href = URL.createObjectURL(file);
  a.download = 'songName.json';
  a.click();
};