const cntCanvas = document.getElementById('componentCanvas');
const cntCtx = cntCanvas.getContext("2d");
const tmlCanvas = document.getElementById('timelineCanvas');
const tmlCtx = tmlCanvas.getContext("2d");
let isSongPlaying = false;
let settings, tracks, song;
let mode = 0; //0: move tool, 1: edit tool
let isSettingsOpened = false;
let userName = '';
let pattern = {
  "information": {
    "version": "1.0",
    "track": "",
    "producer": "",
    "author": "",
    "bpm": "",
    "speed": "",
    "offset": ""
  },
  "patterns" : [],
  "bullets" : [],
  "triggers" : []
};

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
  sync = parseInt(settings.sound.offset);
};

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
      tracks = data.tracks;
      for(let i = 0; tracks.length > i; i++) {
        let option = document.createElement("option");
        option.innerHTML = tracks[i].name;
        option.value = tracks[i].name;
        document.getElementById("songSelectBox").options.add(option);
      }
    } else {
      alert('Failed to load song list.');
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
  initialize();
});

const newEditor = () => {
  document.getElementById('songSelectionContainer').style.display = 'flex';
};

const songSelected = () => {
  song = new Howl({
    src: [`${cdnUrl}/tracks/128kbps/${tracks[songSelectBox.selectedIndex].fileName}.mp3`],
    autoplay: false,
    loop: false,
    onend: () => {
      song.stop();
    },
    onload: () => {
    }
  });
  songName.innerText = tracks[songSelectBox.selectedIndex].name;
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[0].value = songName.innerText;
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[1].value = tracks[songSelectBox.selectedIndex].producer;
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[2].value = userName;
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[3].value = tracks[songSelectBox.selectedIndex].bpm;
  document.getElementById('canvasBackgroundImage').style.backgroundImage = `url(${cdnUrl}/albums/${tracks[songSelectBox.selectedIndex].fileName}.png)`;
  document.getElementById('songSelectionContainer').style.display = 'none';
  document.getElementById('initialScreenContainer').style.display = 'none';
  document.getElementById('editorMainContainer').style.display = 'initial';
};

const toggleSettings = () => {
  if(isSettingsOpened) {
    document.getElementById('settingsContainer').style.display = 'none';
  } else {
    document.getElementById('settingsContainer').style.display = 'flex';
  }
  isSettingsOpened = !isSettingsOpened;
};

const changeMode = (n) => {
  document.getElementsByClassName('menuIcon')[n].classList.toggle('menuSelected');
  document.getElementsByClassName('menuIcon')[mode].classList.toggle('menuSelected');
  document.getElementsByClassName('menuIcon')[n].classList.toggle('clickable');
  document.getElementsByClassName('menuIcon')[mode].classList.toggle('clickable');
  mode = n;
}

const drawNote = (p, x, y) => {
  x = cntCanvas.width / 200 * x;
  y = cntCanvas.height / 200 * y;
  let w = cntCanvas.width / 40;
  let grd = cntCtx.createLinearGradient(x - w, y - w, x + w, y + w);
  grd.addColorStop(0, "#fb4934");
  grd.addColorStop(1, "#ebd934");
  cntCtx.strokeStyle = grd;
  cntCtx.fillStyle = grd;
  cntCtx.lineWidth = Math.round(cntCanvas.width / 500);
  cntCtx.beginPath();
  cntCtx.arc(x, y, w, 0, 2 * Math.PI);
  cntCtx.stroke();
  cntCtx.beginPath();
  cntCtx.arc(x, y, w / 100 * p, 0, 2 * Math.PI);
  cntCtx.fill();
};

const drawBullet = (n, x, y, a) => {
  x = cntCanvas.width / 200 * x;
  y = cntCanvas.height / 200 * y;
  let w = cntCanvas.width / 80;
  cntCtx.fillStyle = "#555";
  cntCtx.strokeStyle = "#555";
  cntCtx.beginPath();
  switch(n) {
    case 0:
      a = Math.PI * (a / 180 + 0.5);
      cntCtx.arc(x, y, w, a, a + Math.PI);
      a = a - (0.5 * Math.PI);
      cntCtx.moveTo(x - (w * Math.sin(a)), y + (w * Math.cos(a)));
      cntCtx.lineTo(x + (w * 2 * Math.cos(a)), y + (w * 2 * Math.sin(a)));
      cntCtx.lineTo(x + (w * Math.sin(a)), y - (w * Math.cos(a)));
      cntCtx.fill();
      break;
    case 1:
      cntCtx.arc(x, y, w, 0, Math.PI * 2);
      cntCtx.fill();
      break;
    default:
      alert("Wrong draw access.");
  }
};

const eraseCanvas = () => {
  cntCtx.clearRect(0, 0, cntCanvas.width, cntCanvas.height);
}

const initialize = () => {
  cntCanvas.width = window.innerWidth * 0.6;
  cntCanvas.height = window.innerHeight * 0.65;
  tmlCanvas.width = window.innerWidth;
  tmlCanvas.height = window.innerHeight * 0.27;
};

const gotoMain = () => {
  if(confirm(rusure)) {
    document.getElementById('initialScreenContainer').style.display = 'initial';
    document.getElementById('songSelectionContainer').style.display = 'none';
    document.getElementsByClassName
    songSelectBox.selectedIndex = 0;
    document.getElementById('editorMainContainer').style.display = 'none';
    pattern = {
      "information": {
        "version": "1.0",
        "track": "",
        "producer": "",
        "author": "",
        "bpm": "",
        "speed": "",
        "offset": ""
      },
      "patterns" : [],
      "bullets" : [],
      "triggers" : []
    };
  }
};

const songControl = () => {
  if(document.getElementById('editorMainContainer').style.display == 'initial') {
    if(isSongPlaying) {
      song.stop();
      isSongPlaying = false;
    } else {
      song.play();
      isSongPlaying = true;
    }
  }
}

const save = () => {
  let trackSettingsForm = trackSettings.getElementsByClassName('settingsPropertiesTextbox');
  pattern.information = {
    "version": "1.0",
    "track": trackSettingsForm[0].value,
    "producer": trackSettingsForm[1].value,
    "author": trackSettingsForm[2].value,
    "bpm": trackSettingsForm[3].value,
    "speed": trackSettingsForm[4].value,
    "offset": trackSettingsForm[5].value
  };
  let a = document.createElement("a");
  let file = new Blob([JSON.stringify(pattern)], {type: 'application/json'});
  a.href = URL.createObjectURL(file);
  a.download = `${songName.innerText}.json`;
  a.click();
};

const scrollHorizontally = (e) => {
  e = window.event || e;
  console.log(Math.min(1, (e.wheelDelta || -e.detail)));
  let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  document.getElementById('timelineContainer').scrollLeft -= (delta * 30);
  e.preventDefault();
};

document.getElementById('timelineContainer').addEventListener("mousewheel", scrollHorizontally);
document.getElementById('timelineContainer').addEventListener("DOMMouseScroll", scrollHorizontally);
window.addEventListener("resize", initialize);

window.addEventListener("beforeunload", function (e) {
  (e || window.event).returnValue = rusure;
  return rusure;
});

document.onkeypress = e => {
  if(e.keyCode == 32) {
    console.log('yo');
  }
};