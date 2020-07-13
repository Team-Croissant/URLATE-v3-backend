const cntCanvas = document.getElementById('componentCanvas');
const cntCtx = cntCanvas.getContext("2d");
const tmlCanvas = document.getElementById('timelineCanvas');
const tmlCtx = tmlCanvas.getContext("2d");
let settings, tracks, song, bpm = 130, speed = 2, offset = 0, sync = 0, rate = 1, split = 2;
let mouseX = 0, mouseY = 0, mouseMode = 0;
let mode = 0; //0: move tool, 1: edit tool, 2: add tool
let zoom = 1;
let timelineYLoc = 0, timelineElementNum = 0, timelineScrollCount = 6;
let selectedBullet = 0; //same with spec value
let isSettingsOpened = false;
let mouseDown = false;
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
  "patterns" : [
    {"ms": 6/18*1000, "value": 0, "x": -50, "y" : -50},
    {"ms": 6/18*2000, "value": 0, "x": 0, "y" : -50},
    {"ms": 6/18*3000, "value": 0, "x": 50, "y" : -50},
    {"ms": 6/18*4000, "value": 0, "x": -50, "y" : 50},
    {"ms": 6/18*21000, "value": 0, "x": -50, "y" : -50},
    {"ms": 6/18*22000, "value": 0, "x": 0, "y" : -50},
    {"ms": 6/18*23000, "value": 0, "x": 50, "y" : -50},
    {"ms": 6/18*24000, "value": 0, "x": -50, "y" : 50},
    {"ms": 6/18*25000, "value": 0, "x": 0, "y" : 50},
    {"ms": 6/18*26000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*27000, "value": 0, "x": 0, "y" : 0},
    {"ms": 6/18*28000, "value": 0, "x": -50, "y" : 50},
    {"ms": 6/18*29000, "value": 0, "x": 0, "y" : 50},
    {"ms": 6/18*30000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*31000, "value": 0, "x": 0, "y" : 0},
    {"ms": 6/18*32000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*33000, "value": 0, "x": 0, "y" : 0},
    {"ms": 6/18*34000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*35000, "value": 0, "x": 0, "y" : 0},
    {"ms": 6/18*36000, "value": 0, "x": 0, "y" : 50},
    {"ms": 6/18*37000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*38000, "value": 0, "x": 0, "y" : 0},
    {"ms": 6/18*39000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*40000, "value": 0, "x": 0, "y" : 0},
    {"ms": 6/18*41000, "value": 0, "x": 50, "y" : 50},
    {"ms": 6/18*42000, "value": 0, "x": 0, "y" : 0},
  ],
  "bullets" : [
    {"ms": 6/18*1000, "value": 0, "direction": "L", "location": 0, "angle": 0, "speed": 2},
    {"ms": 6/18*1000, "value": 0, "direction": "R", "location": 0, "angle": 0, "speed": 2},
    {"ms": 6/18*3000, "value": 0, "direction": "L", "location": 0, "angle": 30, "speed": 2},
    {"ms": 6/18*3000, "value": 0, "direction": "R", "location": 0, "angle": 30, "speed": 2},
    {"ms": 6/18*5000, "value": 0, "direction": "L", "location": 0, "angle": 45, "speed": 2},
    {"ms": 6/18*5000, "value": 0, "direction": "R", "location": 0, "angle": 45, "speed": 2},
    {"ms": 6/18*7000, "value": 0, "direction": "L", "location": 0, "angle": 60, "speed": 2},
    {"ms": 6/18*7000, "value": 0, "direction": "R", "location": 0, "angle": 60, "speed": 2},
    {"ms": 6/18*9000, "value": 0, "direction": "L", "location": 0, "angle": 75, "speed": 1},
    {"ms": 6/18*9000, "value": 0, "direction": "R", "location": 0, "angle": 75, "speed": 1},
    {"ms": 6/18*10000, "value": 1, "direction": "L", "location": 0, "speed": 1},
    {"ms": 6/18*10000, "value": 1, "direction": "R", "location": 0, "speed": 1},
    {"ms": 6/18*12000, "value": 1, "direction": "L", "location": 0, "speed": 2},
    {"ms": 6/18*12000, "value": 1, "direction": "R", "location": 0, "speed": 2},
    {"ms": 6/18*14000, "value": 1, "direction": "L", "location": 0, "speed": 3},
    {"ms": 6/18*14000, "value": 1, "direction": "R", "location": 0, "speed": 3},
    {"ms": 6/18*16000, "value": 1, "direction": "L", "location": 0, "speed": 4},
    {"ms": 6/18*16000, "value": 1, "direction": "R", "location": 0, "speed": 4},
    {"ms": 6/18*18000, "value": 1, "direction": "L", "location": 0, "speed": 5},
    {"ms": 6/18*18000, "value": 1, "direction": "R", "location": 0, "speed": 5},
    {"ms": 6/18*21000, "value": 0, "direction": "L", "location": 0, "angle": 0, "speed": 2},
    {"ms": 6/18*21000, "value": 0, "direction": "L", "location": 0, "angle": -30, "speed": 3},
    {"ms": 6/18*21000, "value": 0, "direction": "L", "location": 0, "angle": -45, "speed": 4},
    {"ms": 6/18*21000, "value": 0, "direction": "L", "location": 0, "angle": 30, "speed": 3},
    {"ms": 6/18*21000, "value": 0, "direction": "L", "location": 0, "angle": 45, "speed": 4},
    {"ms": 6/18*21000, "value": 0, "direction": "R", "location": 0, "angle": 0, "speed": 2},
    {"ms": 6/18*21000, "value": 0, "direction": "R", "location": 0, "angle": -30, "speed": 3},
    {"ms": 6/18*21000, "value": 0, "direction": "R", "location": 0, "angle": -45, "speed": 4},
    {"ms": 6/18*21000, "value": 0, "direction": "R", "location": 0, "angle": 30, "speed": 3},
    {"ms": 6/18*21000, "value": 0, "direction": "R", "location": 0, "angle": 45, "speed": 4},
  ],
  "triggers" : []
};
let pointingCntElement = {"v1": '', "v2": '', "i": ''};
let selectedCntElement = {"v1": '', "v2": '', "i": ''};
let circleBulletAngles = [];

const sortAsTiming = (a, b) => {
  if(a.ms == b.ms) return 0;
  return a.ms > b.ms ? 1 : -1;
};

const calcAngleDegrees = (x, y) => {
  return Math.atan2(y, x) * 180 / Math.PI;
};

const getTan = deg => {
  let rad = deg * Math.PI / 180;
  return Math.tan(rad);
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
  document.getElementById('initialButtonsContainer').style.display = 'none';
  document.getElementById('songSelectionContainer').style.display = 'flex';
};

const songSelected = () => {
  song = new Howl({
    src: [`${cdn}/tracks/${settings.sound.quality}/${tracks[songSelectBox.selectedIndex].fileName}.mp3`],
    autoplay: false,
    loop: false,
    onend: () => {
      document.getElementById('controlBtn').classList.remove('timeline-play');
      document.getElementById('controlBtn').classList.remove('timeline-pause');
      document.getElementById('controlBtn').classList.add('timeline-play');
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
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[4].value = 2;
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[5].value = 0;
  bpm = tracks[songSelectBox.selectedIndex].bpm;
  offset = 0;
  speed = 2;
  document.getElementById('canvasBackgroundImage').style.backgroundImage = `url(${cdn}/albums/${tracks[songSelectBox.selectedIndex].fileName}.png)`;
  document.getElementById('songSelectionContainer').style.display = 'none';
  document.getElementById('initialScreenContainer').style.display = 'none';
  document.getElementById('editorMainContainer').style.display = 'initial';
  window.requestAnimationFrame(cntRender);
};

const toggleSettings = () => {
  if(isSettingsOpened) {
    document.getElementById('settingsContainer').style.display = 'none';
    document.getElementById('timelineContainer').style.width = '100vw';
    document.getElementById('timelineZoomController').style.right = '1.5vw';
    document.getElementById('timelineSplitController').style.left = '11vw';
    tmlCanvas.style.width = '100vw';
    tmlCanvas.width = window.innerWidth;
  } else {
    document.getElementById('settingsContainer').style.display = 'flex';
    document.getElementById('timelineContainer').style.width = '80vw';
    document.getElementById('timelineZoomController').style.right = '21vw';
    document.getElementById('timelineSplitController').style.left = '9vw';
    tmlCanvas.style.width = '80vw';
    tmlCanvas.width = window.innerWidth * 0.8;
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

const drawNote = (p, x, y, s) => {
  p = Math.max(p, 0);
  x = cntCanvas.width / 200 * (x + 100);
  y = cntCanvas.height / 200 * (y + 100);
  let w = cntCanvas.width / 40;
  let grd = cntCtx.createLinearGradient(x - w, y - w, x + w, y + w);
  let opacity = 1;
  if(p > 100) {
    opacity = (130 - p) / 130;
  }
  if(s == true) {
    grd.addColorStop(0, `rgba(235, 213, 52, ${opacity})`);
    grd.addColorStop(1, `rgba(235, 213, 52, ${opacity})`);
  } else {
    grd.addColorStop(0, `rgba(251, 73, 52, ${opacity})`);
    grd.addColorStop(1, `rgba(235, 217, 52, ${opacity})`);
  }
  cntCtx.strokeStyle = grd;
  cntCtx.fillStyle = grd;
  cntCtx.lineWidth = Math.round(cntCanvas.width / 500);
  cntCtx.beginPath();
  cntCtx.arc(x, y, w, 0, p / 50 * Math.PI);
  cntCtx.stroke();
  cntCtx.beginPath();
  cntCtx.arc(x, y, w / 100 * p, 0, 2 * Math.PI);
  cntCtx.fill();
};

const drawBullet = (n, x, y, a, s) => {
  x = cntCanvas.width / 200 * (x + 100);
  y = cntCanvas.height / 200 * (y + 100);
  let w = cntCanvas.width / 80;
  if(s == true) {
    cntCtx.fillStyle = "#ebd534";
    cntCtx.strokeStyle = "#ebd534";
  } else {
    cntCtx.fillStyle = "#555";
    cntCtx.strokeStyle = "#555";
  }
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

const eraseCnt = () => {
  cntCtx.clearRect(0, 0, cntCanvas.width, cntCanvas.height);
}

const eraseTml = () => {
  tmlCtx.clearRect(0, 0, tmlCanvas.width, tmlCanvas.height);
}

const initialize = () => {
  cntCanvas.width = window.innerWidth * 0.6;
  cntCanvas.height = window.innerHeight * 0.65;
  tmlCanvas.width = window.innerWidth;
  tmlCanvas.height = window.innerHeight * 0.27;
};

const gotoMain = (isCalledByMain) => {
  if(isCalledByMain || confirm(rusure)) {
    if(!isCalledByMain) song.stop();
    changeSettingsMode(-1);
    if(isSettingsOpened) toggleSettings();
    selectedCntElement = {"v1": '', "v2": '', "i": ''};
    document.getElementById('initialScreenContainer').style.display = 'block';
    document.getElementById('initialButtonsContainer').style.display = 'flex';
    document.getElementById('songSelectionContainer').style.display = 'none';
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

const trackMouseSelection = (i, v1, v2, x, y) => {
  if(mode != 2 && mouseMode == 0) {
    if(pointingCntElement.i == '') { //MEMO: this line rejects overlap of tracking
      const seek = song.seek() - (offset + sync) / 1000;
      switch(v1) {
        case 0:
          const p = ((bpm * 14 / speed) - (pattern.patterns[i].ms - (seek * 1000))) / (bpm * 14 / speed) * 100;
          if(Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) <= cntCanvas.width / 150 && p <= 100) {
            pointingCntElement = {"v1": v1, "v2": v2, "i": i};
          }
          break;
        case 1:
          switch(v2) {
            case 0:
              if(song.playing()) {
                if(Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) <= cntCanvas.width / 350) {
                  pointingCntElement = {"v1": v1, "v2": v2, "i": i};
                }
              } else {
                if(Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) <= cntCanvas.width / 250) {
                  pointingCntElement = {"v1": v1, "v2": v2, "i": i};
                }
              }
              break;
            case 1:
              if(song.playing()) {
                if(Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) <= cntCanvas.width / 400) {
                  pointingCntElement = {"v1": v1, "v2": v2, "i": i};
                }
              } else {
                if(Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) <= cntCanvas.width / 300) {
                  pointingCntElement = {"v1": v1, "v2": v2, "i": i};
                }
              }
              break;
            default:
              alert("trackMouseSelection:Error");
          }
          break;
        default:
          alert("trackMouseSelection:Error");
      }
    }
  }
};

const selectedCheck = (n, i) => {
  return pointingCntElement.v1 === n && pointingCntElement.i == i || selectedCntElement.v1 === n && selectedCntElement.i == i;
};

const tmlRender = () => {
  eraseTml();
  const tmlStartX = tmlCanvas.width / 10,
        startX = tmlCanvas.width / 80,
        startY = tmlCanvas.height / 6,
        endX = tmlCanvas.width / 1.01,
        endY = tmlCanvas.height / 1.1,
        height = tmlCanvas.height / 9;
  const seek = song.seek(),
        minutes = Math.floor(seek / 60),
        seconds = seek - minutes * 60;
  const renderStart = parseInt(seek * 1000) - (60000 / bpm * zoom),
        renderEnd = parseInt(renderStart + (5000 * zoom)),
        baseMs = 60 / bpm * 1000,
        msToPx = (endX - tmlStartX) / (renderEnd - renderStart);
  tmlCtx.beginPath();
  tmlCtx.fillStyle = '#F3F3F3';
  tmlCtx.fillRect(tmlStartX, startY, endX - tmlStartX, endY - startY);
  let start = lowerBound(pattern.patterns, renderStart);
  let end = upperBound(pattern.patterns, renderEnd);
  const renderNotes = pattern.patterns.slice(start, end);
  start = lowerBound(pattern.bullets, renderStart);
  end = upperBound(pattern.bullets, renderEnd);
  const renderBullets = pattern.bullets.slice(start, end);
  let bulletsOverlapNum = 0;
  let bulletsOverlap = {};
  for(let i = 0; i < renderBullets.length; i++) {
    let count = 0;
    if(bulletsOverlap[parseInt(renderBullets[i].ms / 100)]) {
      bulletsOverlap[parseInt(renderBullets[i].ms / 100)]++;
    } else {
      bulletsOverlap[parseInt(renderBullets[i].ms / 100)] = 1;
    }
    for(let j = 0; j < renderBullets.length; j++) {
      if(parseInt(renderBullets[i].ms / 100) == parseInt(renderBullets[j].ms / 100)) {
        count++;
      }
    }
    if(bulletsOverlapNum < count) bulletsOverlapNum = count;
  }
  for(let j = 0; j < renderNotes.length; j++) {
    tmlCtx.beginPath();
    if(start + j == selectedCntElement.i && selectedCntElement.v1 == '0') {
      tmlCtx.fillStyle = "#ebd534";
    } else {
      tmlCtx.fillStyle = '#fbaf34';
    }
    tmlCtx.arc(tmlStartX + parseInt((renderNotes[j].ms - renderStart) * msToPx), startY + timelineYLoc + height / 2, height / 3, 0, 2 * Math.PI);
    tmlCtx.fill();
  }
  for(let j = 0; j < renderBullets.length; j++) {
    tmlCtx.beginPath();
    if(start + j == selectedCntElement.i && selectedCntElement.v1 == '1') {
      tmlCtx.fillStyle = "#5ee3f2";
    } else {
      tmlCtx.fillStyle = '#4297d4';
    }
    let x = tmlStartX + parseInt((renderBullets[j].ms - renderStart) * msToPx);
    let y = startY + timelineYLoc + height * bulletsOverlap[parseInt(renderBullets[j].ms / 100)] + height / 2;
    let w = height / 3;
    if(renderBullets[j].value == 0) {
      tmlCtx.moveTo(x - w, y);
      tmlCtx.lineTo(x, y + w);
      tmlCtx.lineTo(x + w, y);
      tmlCtx.lineTo(x, y - w);
      tmlCtx.lineTo(x - w, y);
    } else if(renderBullets[j].value == 1) {
      tmlCtx.arc(x, y, w, 0, 2 * Math.PI);
    }
    bulletsOverlap[parseInt(renderBullets[j].ms / 100)]--;
    tmlCtx.fill();
  }
  tmlCtx.fillStyle = '#FFF';
  tmlCtx.fillRect(0, 0, tmlStartX, endY);
  tmlCtx.beginPath();
  tmlCtx.fillStyle = '#fbaf34';
  tmlCtx.arc(startX, startY + height / 2 + timelineYLoc, height / 6, 0, 2 * Math.PI);
  tmlCtx.fill();
  tmlCtx.fillStyle = '#111';
  tmlCtx.textAlign = "left";
  tmlCtx.font = `${tmlCanvas.height / 14}px Metropolis`;
  tmlCtx.fillText('Note', startX * 1.2 + height / 6, startY + timelineYLoc + height / 1.8);
  let i = 1;
  for(i; i <= bulletsOverlapNum; i++) {
    tmlCtx.beginPath();
    tmlCtx.fillStyle = '#2f91ed';
    tmlCtx.arc(startX, startY + timelineYLoc + height * i + height / 2, height / 6, 0, 2 * Math.PI);
    tmlCtx.fill();
    tmlCtx.fillStyle = '#111';
    tmlCtx.fillText('Bullet', startX * 1.2 + height / 6, startY + timelineYLoc + height * i + height / 1.8);
  }
  for(i; i < bulletsOverlapNum + 2; i++) { //TODO
    tmlCtx.beginPath();
    tmlCtx.fillStyle = '#3ccc1f';
    tmlCtx.arc(startX, startY + height * i + height / 2 + timelineYLoc, height / 6, 0, 2 * Math.PI);
    tmlCtx.fill();
    tmlCtx.fillStyle = '#111';
    tmlCtx.fillText('Trigger', startX * 1.2 + height / 6, startY + timelineYLoc + height * i + height / 1.8);
  }
  timelineElementNum = i;
  tmlCtx.fillStyle = '#FFF';
  tmlCtx.fillRect(0, endY, endX, tmlCanvas.height - endY);
  tmlCtx.fillRect(0, 0, endX, startY);
  tmlCtx.font = `${tmlCanvas.height / 16}px Metropolis`;
  tmlCtx.textAlign = "center";
  tmlCtx.textBaseline = "bottom";
  tmlCtx.fillStyle = '#777';
  for(let t = (baseMs - renderStart % baseMs) - baseMs; t <= renderEnd + baseMs; t += baseMs) {
    if((renderStart + t) / 1000 < song._duration && (renderStart + t) / 1000 >= 0) {
      const tmlMinutes = Math.floor((renderStart + t) / 60000),
            tmlSeconds = (renderStart + t) / 1000 - tmlMinutes * 60;
      tmlCtx.fillText(`${String(tmlMinutes).padStart(2, '0')}:${tmlSeconds.toFixed(2).padStart(5, '0')}`, tmlStartX + t * msToPx, startY / 1.3);
      for(let i = 1; i <= split; i++) {
        tmlCtx.beginPath();
        let strokeY;
        if(i == split) {
          tmlCtx.strokeStyle = '#555';
          strokeY = startY - 10;
        } else {
          tmlCtx.strokeStyle = '#999';
          strokeY = startY - 5;
        }
        tmlCtx.moveTo(tmlStartX + t * msToPx + baseMs * msToPx / split * i, startY);
        tmlCtx.lineTo(tmlStartX + t * msToPx + baseMs * msToPx / split * i, strokeY);
        tmlCtx.stroke();
      }
    }
  }
  tmlCtx.fillStyle = '#FFF';
  tmlCtx.fillRect(0, 0, tmlStartX, startY);
  tmlCtx.fillStyle = '#2f91ed';
  tmlCtx.font = `${tmlCanvas.height / 11}px Heebo`;
  tmlCtx.textBaseline = "middle";
  tmlCtx.textAlign = "right";
  if(tmlCanvas.height / tmlCanvas.width < 0.16) {
    if(isNaN(minutes)) {
      tmlCtx.fillText('Wait..', tmlStartX, startY / 1.7);
    } else {
      tmlCtx.fillText(`${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`, tmlStartX, startY / 1.7);
    }
  }
  tmlCtx.beginPath();
  tmlCtx.fillStyle = '#555';
  tmlCtx.strokeStyle = '#555';
  let lineX = tmlStartX + baseMs * (endX - tmlStartX) / 5000;
  tmlCtx.moveTo(lineX, endY);
  tmlCtx.lineTo(lineX, startY);
  tmlCtx.stroke();
  tmlCtx.lineTo(lineX - 5, startY - 5);
  tmlCtx.lineTo(lineX - 5, startY - 20);
  tmlCtx.lineTo(lineX + 5, startY - 20);
  tmlCtx.lineTo(lineX + 5, startY - 5);
  tmlCtx.lineTo(lineX, startY);
  tmlCtx.fill();
};

const cntRender = () => {
  pointingCntElement = {"v1": '', "v2": '', "i": ''};
  window.requestAnimationFrame(cntRender);
  const seek = song.seek() - (offset + sync) / 1000;
  let start = lowerBound(pattern.patterns, seek * 1000 - (bpm * 4 / speed));
  let end = upperBound(pattern.patterns, seek * 1000 + (bpm * 14 / speed));
  const renderNotes = pattern.patterns.slice(start, end);
  eraseCnt();
  if(mode == 2 && mouseMode == 0) {
    let p = [0, 0];
    if(mouseX < -80) {
      p[0] = (-80 - mouseX) / 20;
    } else if(mouseX > 80) {
      p[1] = (mouseX - 80) / 20;
    }
    if(p[0] == 0 && p[1] == 0) {
      drawNote(100, mouseX, mouseY, true);
    } else {
      if(p[1] == 0) {
        drawBullet(selectedBullet, -100, mouseY, 0, true);
      } else {
        drawBullet(selectedBullet, 100, mouseY, 180, true);
      }
    }
  }
  for(let i = 0; i < renderNotes.length; i++) {
    const p = ((bpm * 14 / speed) - (renderNotes[i].ms - (seek * 1000))) / (bpm * 14 / speed) * 100;
    trackMouseSelection(start + i, 0, renderNotes[i].value, renderNotes[i].x, renderNotes[i].y);
    drawNote(p, renderNotes[i].x, renderNotes[i].y, selectedCheck(0, start + i));
  }
  start = lowerBound(pattern.bullets, seek * 1000 - (bpm * 40));
  end = upperBound(pattern.bullets, seek * 1000);
  const renderBullets = pattern.bullets.slice(start, end);
  for(let i = 0; i < renderBullets.length; i++) {
    const p = (seek * 1000 - renderBullets[i].ms) / (bpm * 40 / speed / renderBullets[i].speed) * 100;
    const left = renderBullets[i].direction == 'L';
    let x = (left ? -1 : 1) * (100 - p);
    let y = 0;
    if(renderBullets[i].value == 0) {
      y = renderBullets[i].location + p * getTan(renderBullets[i].angle) * (left ? 1 : -1);
      trackMouseSelection(start + i, 1, renderBullets[i].value, x, y);
      drawBullet(renderBullets[i].value, x, y, renderBullets[i].angle + (left ? 0 : 180), selectedCheck(1, start + i));
    } else {
      if(!circleBulletAngles[start+i]) circleBulletAngles[start+i] = calcAngleDegrees((left ? -100 : 100) - mouseX, renderBullets[i].location - mouseY);
      if(left) {
        if(110 > circleBulletAngles[start+i] && circleBulletAngles[start+i] > 0) circleBulletAngles[start+i] = 110;
        else if(0 > circleBulletAngles[start+i] && circleBulletAngles[start+i] > -110) circleBulletAngles[start+i] = -110;
      } else {
        if(70 < circleBulletAngles[start+i] && circleBulletAngles[start+i] > 0) circleBulletAngles[start+i] = 70;
        else if(0 > circleBulletAngles[start+i] && circleBulletAngles[start+i] < -70) circleBulletAngles[start+i] = -70;
      }
      y = renderBullets[i].location + p * getTan(circleBulletAngles[start+i]) * (left ? 1 : -1);
      trackMouseSelection(start + i, 1, renderBullets[i].value, x, y);
      drawBullet(renderBullets[i].value, x, y, '', selectedCheck(1, start + i));
    }
  }
  tmlRender();
  if(pointingCntElement.i === '') {
    componentView.style.cursor = "";
  } else {
    componentView.style.cursor = "url('/images/parts/cursor/blueSelect.cur'), pointer";
  }
};

const songPlayPause = () => {
  if(document.getElementById('editorMainContainer').style.display == 'initial') {
    if(song.playing()){
      document.getElementById('controlBtn').classList.add('timeline-play');
      document.getElementById('controlBtn').classList.remove('timeline-pause');
      song.pause();
    } else {
      document.getElementById('controlBtn').classList.add('timeline-pause');
      document.getElementById('controlBtn').classList.remove('timeline-play');
      circleBulletAngles = [];
      song.play();
    }
  }
};

const lowerBound = (array, value) => {
  if(value < 0) value = 0;
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (value <= array[mid].ms) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
};

const upperBound = (array, value) => {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (value >= array[mid].ms) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

const save = () => {
  let trackSettingsForm = trackSettings.getElementsByClassName('settingsPropertiesTextbox');
  pattern.information = {
    "version": "1.0",
    "track": trackSettingsForm[0].value,
    "producer": trackSettingsForm[1].value,
    "author": trackSettingsForm[2].value,
    "bpm": bpm,
    "speed": speed,
    "offset": offset
  };
  let a = document.createElement("a");
  let file = new Blob([JSON.stringify(pattern)], {type: 'application/json'});
  a.href = URL.createObjectURL(file);
  a.download = `${songName.innerText}.json`;
  a.click();
};

const deleteAll = () => {
  if(confirm(deleteSure)) {
    song.stop();
    changeSettingsMode(-1);
    if(isSettingsOpened) toggleSettings();
    selectedCntElement = {"v1": '', "v2": '', "i": ''};
    songSelectBox.selectedIndex = 0;
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

const settingsInput = (v, e) => {
  switch(v) {
    case 'x':
    case 'y':
      if(isNaN(Number(e.value))) {
        if(e.value != '-') {
          alert("Input value is not number.");
        }
      } else if(Number(e.value) > 100) {
        alert("Input value is too high.");
      } else if(Number(e.value) < -100) {
        alert("Input value is too low.");
      } else {
        pattern.patterns[selectedCntElement.i][v] = Number(e.value);
        return;
      }
      e.value = pattern.patterns[selectedCntElement.i][v];
      break;
    case 'Timing':
      if(isNaN(Number(e.value))) {
        alert("Input value is not number.");
      } else if(Number(e.value) < 0) {
        alert("Input value is too low.");
      } else {
        if(selectedCntElement.v1 == 0) {
          pattern.patterns[selectedCntElement.i].ms = Number(e.value);
        } else {
          pattern.bullets[selectedCntElement.i].ms = Number(e.value);
        }
      }
      if(selectedCntElement.v1 == 0) {
        e.value = pattern.patterns[selectedCntElement.i].ms.toFixed();
      } else {
        e.value = pattern.bullets[selectedCntElement.i].ms.toFixed();
      }
      break;
    case 'Side':
      if(e.value.toUpperCase() == 'L' || e.value.toUpperCase() == 'LEFT') {
        pattern.bullets[selectedCntElement.i].direction = 'L';
      } else if(e.value.toUpperCase() == 'R' || e.value.toUpperCase() == 'RIGHT') {
        pattern.bullets[selectedCntElement.i].direction = 'R';
      } else if(e.value == '') {
        if(pattern.bullets[selectedCntElement.i].direction == 'L') {
          pattern.bullets[selectedCntElement.i].direction = 'R';
        } else {
          pattern.bullets[selectedCntElement.i].direction = 'L';
        }
      } else {
        pattern.bullets[selectedCntElement.i].direction = 'L';
        alert("Input is wrong value.");
      }
      e.value = pattern.bullets[selectedCntElement.i].direction;
      break;
    case 'Location':
      if(isNaN(Number(e.value))) {
        if(e.value != '-') {
          alert("Input value is not number.");
        }
      } else if(Number(e.value) > 100) {
        alert("Input value is too high.");
      } else if(Number(e.value) < -100) {
        alert("Input value is too low.");
      } else {
        pattern.bullets[selectedCntElement.i].location = Number(e.value);
        return;
      }
      e.value = pattern.bullets[selectedCntElement.i].location;
      break;
    case 'Angle':
      if(isNaN(Number(e.value))) {
        if(e.value != '-') {
          alert("Input value is not number.");
        }
      } else {
        pattern.bullets[selectedCntElement.i].angle = Number(e.value);
        return;
      }
      e.value = pattern.bullets[selectedCntElement.i].angle;
      break;
    case 'Speed':
      let element;
      if(selectedCntElement.v1 == 0) {
        element = pattern.patterns[selectedCntElement.i];
      } else if(selectedCntElement.v1 == 1) {
        element = pattern.bullets[selectedCntElement.i];
      } else {
        alert("Wrong Element.");
      }
      if(isNaN(Number(e.value))) {
        if(e.value != '-') {
          alert("Input value is not number.");
        }
      } else if(Number(e.value) > 5) {
        alert("Input value is too high.");
      } else if(Number(e.value) <= 0) {
        alert("Input value is too low.");
      } else {
        element.speed = Number(e.value);
        return;
      }
      e.value = element.speed;
      break;
    default:
      alert("settingsInput:Error");
  }
  pattern.patterns.sort(sortAsTiming);
  pattern.bullets.sort(sortAsTiming);
  pattern.triggers.sort(sortAsTiming);
};

const changeBPM = (e) => {
  if(isNaN(Number(e.value))) {
    alert("Input value is not number.");
  } else {
    bpm = Number(e.value);
  }
};

const changeSpeed = (e) => {
  if(isNaN(Number(e.value))) {
    alert("Input value is not number.");
  } else {
    if(Number(e.value) > 5) {
      alert("Input value is too high.");
    } else if(Number(e.value) <= 0) {
      alert("Input value is too low.");
    } else {
      speed = Number(e.value);
    }
  }
};

const changeOffset = (e) => {
  if(isNaN(Number(e.value))) {
    alert("Input value is not number.");
  } else {
    offset = Number(e.value);
  }
};

const trackMousePos = () => {
  const width = parseInt((componentView.offsetWidth - canvasContainer.offsetWidth) / 2 + menuContainer.offsetWidth);
  const height = navbar.offsetHeight;
  const x = (event.clientX - width) / canvasContainer.offsetWidth * 200 - 100;
  const y = (event.clientY - height) / canvasContainer.offsetHeight * 200 - 100;
  if(!(x < -100 || y < -100 || x > 100 || y > 100)) {
    mouseMode = 0;
    mouseX = x;
    mouseY = y;
  } else {
    mouseMode = -1;
  }
}

const trackTimelineMousePos = () => {
  mouseMode = 1;
  mouseX = event.clientX;
  mouseY = event.clientY - Math.floor(window.innerHeight / 100 * 73);
  //console.log(mouseX, mouseY);
}

const elementFollowMouse = (v1, v2, i) => {
  requestAnimationFrame(() => {
    if(mouseDown && (pointingCntElement.v1 !== '' || v1 != undefined)) {
      if(v1 == undefined) {
        v1 = pointingCntElement.v1;
        v2 = pointingCntElement.v2;
        i = pointingCntElement.i;
      }
      switch(v1) {
        case 0:
          if((mouseX <= 100 || mouseX >= -100) && (mouseY <= 100 || mouseY >= -100) && mouseMode == 0) {
            pattern.patterns[i].x = parseInt(mouseX);
            pattern.patterns[i].y = parseInt(mouseY);
          }
          break;
        case 1:
          if((mouseY <= 100 || mouseY >= -100) && mouseMode == 0) {
            pattern.bullets[i].location = parseInt(mouseY);
          }
          break;
      }
      elementFollowMouse(v1, v2, i);
      changeSettingsMode(v1, v2, i);
    }
  });
};

const compClicked = () => {
  if(mode == 0) {
    elementFollowMouse();
  } else if(mode == 1) {
    if(pointingCntElement.v1 !== '') {
      if(JSON.stringify(pointingCntElement) == JSON.stringify(selectedCntElement)) {
        changeSettingsMode(-1);
        if(isSettingsOpened) toggleSettings();
        selectedCntElement = {"v1": '', "v2": '', "i": ''};
      } else {
        let selectedElement;
        switch(pointingCntElement.v1) {
          case 0:
            selectedElement = pattern.patterns[pointingCntElement.i];
            break;
          case 1:
            selectedElement = pattern.bullets[pointingCntElement.i];
            break;
          default:
            console.log("compClicked:Error");
        }
        changeSettingsMode(pointingCntElement.v1, pointingCntElement.v2, pointingCntElement.i);
        if(!isSettingsOpened) toggleSettings();
        selectedCntElement = pointingCntElement;
      }
    } else {
      changeSettingsMode(-1);
      if(isSettingsOpened) toggleSettings();
      selectedCntElement = {"v1": '', "v2": '', "i": ''};
    }
  } else if(mode == 2) {
    const seek = song.seek() - (offset + sync) / 1000;
    if(mouseX < -80 || mouseX > 80) {
      let newElement = {"ms": parseInt(seek * 1000), "value": selectedBullet, "direction": (mouseX < -80 ? "L" : "R"), "location": parseInt(mouseY), "angle": 0, "speed": 2};
      pattern.bullets.push(newElement);
      pattern.bullets.sort(sortAsTiming);
      for(let i = 0; i < pattern.bullets.length; i++) {
        if(JSON.stringify(pattern.bullets[i]) == JSON.stringify(newElement)) {
          selectedCntElement = {"v1": 1, "v2": selectedBullet, "i": i};
        }
      }
    } else {
      let newElement = {"ms": parseInt(seek * 1000) + 1, "value": 0, "x": parseInt(mouseX), "y" : parseInt(mouseY)};
      pattern.patterns.push(newElement);
      pattern.patterns.sort(sortAsTiming);
      for(let i = 0; i < pattern.patterns.length; i++) {
        if(JSON.stringify(pattern.patterns[i]) == JSON.stringify(newElement)) {
          selectedCntElement = {"v1": 0, "v2": 0, "i": i};
        }
      }
    }
    changeSettingsMode(selectedCntElement.v1, selectedCntElement.v2, selectedCntElement.i);
    if(!isSettingsOpened) toggleSettings();
  }
}

const changeSettingsMode = (v1, v2, i) => {
  trackSettings.style.display = 'none';
  elementsSettings.style.display = 'block';
  switch(v1) {
    case -1:
      trackSettings.style.display = 'block';
      elementsSettings.style.display = 'none';
      document.getElementById("dot").style.color = '#9d4ec2';
      document.getElementById("settingsNameSpace").innerText = 'Settings';
      document.getElementById("trackSettings").style.display = 'block';
      document.getElementById("elementsSettings").style.display = 'none';
      break;
    case 0:
      document.getElementById("dot").style.color = '#f59b42';
      document.getElementById("settingsNameSpace").innerText = `Note_${i}`;
      document.getElementById("trackSettings").style.display = 'none';
      document.getElementById("elementsSettings").style.display = 'block';
      document.getElementById("noteSettingsContainer").style.display = 'block';
      document.getElementById("bulletSettingsContainer").style.display = 'none';
      noteSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[0].value = pattern.patterns[i].x;
      noteSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[1].value = pattern.patterns[i].y;
      noteSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[2].value = pattern.patterns[i].ms.toFixed();
      break;
    case 1:
      document.getElementById("noteSettingsContainer").style.display = 'none';
      document.getElementById("bulletSettingsContainer").style.display = 'block';
      bulletSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[0].value = pattern.bullets[i].direction;
      bulletSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[1].value = pattern.bullets[i].location;
      bulletSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[3].value = pattern.bullets[i].ms.toFixed();
      bulletSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[4].value = pattern.bullets[i].speed;
      switch(v2) {
        case 0:
          document.getElementById("dot").style.color = '#6fdef7';
          bulletSettingsContainer.getElementsByClassName("settingsPropertiesIndividual")[2].style.display = 'flex';
          bulletSettingsContainer.getElementsByClassName("settingsPropertiesTextbox")[2].value = pattern.bullets[i].angle;
          break;
        case 1:
          document.getElementById("dot").style.color = '#575cf2';
          bulletSettingsContainer.getElementsByClassName("settingsPropertiesIndividual")[2].style.display = 'none';
          break;
        default:
          alert("changeSettingsMode:Error");
      }
      document.getElementById("settingsNameSpace").innerText = `Bullet_${i}`;
      break;
    case 2:
      document.getElementById("settingsNameSpace").innerText = `Trigger_${i}`;
      document.getElementById("dot").style.color = '#36bf24';
      break;
    default:
      alert("changeSettingsMode:Error");
  }
}

const zoomIn = () => {
  zoom -= 0.15;
};

const zoomOut = () => {
  zoom += 0.15;
};

const playPauseBtn = () => {
  songPlayPause();
};

const stopBtn = () => {
  document.getElementById('controlBtn').classList.add('timeline-play');
  document.getElementById('controlBtn').classList.remove('timeline-pause');
  song.stop();
};

const changeRate = () => {
  rate += 0.25;
  if(rate > 2) {
    rate = 0.25;
  }
  document.getElementById('percentage').innerText = `${rate * 100}%`;
  song.rate(rate);
};

const test = () => {
  alert(need2Save);
  save();
  let trackSettingsForm = trackSettings.getElementsByClassName('settingsPropertiesTextbox');
  pattern.information = {
    "version": "1.0",
    "track": trackSettingsForm[0].value,
    "producer": trackSettingsForm[1].value,
    "author": trackSettingsForm[2].value,
    "bpm": bpm,
    "speed": speed,
    "offset": offset
  };
  window.location.href = `${url}/test?pattern=${JSON.stringify(pattern)}`;
};

const changeSplit = () => {
  split++;
  if(split == 5) {
    split = 6;
  } else if(split == 7) {
    split = 8;
  } else if(split == 9) {
    split = 12;
  } else if(split == 13) {
    split = 16;
  } else if(split == 17) {
    split = 1;
  }
  document.getElementById('split').innerText = `1/${split}`;
};

const deleteElement = () => {
  if(selectedCntElement.v1 == 0) {
    delete pattern.patterns[selectedCntElement.i];
  } else if(selectedCntElement.v1 == 0) {
    delete pattern.bullets[selectedCntElement.i];
  }
  pattern.patterns.sort(sortAsTiming);
};

/*const scrollHorizontally = e => {
  e = window.event || e;
  let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  document.getElementById('timelineContainer').scrollLeft -= (delta * 30);
  e.preventDefault();
};

document.getElementById('timelineContainer').addEventListener("mousewheel", scrollHorizontally);
document.getElementById('timelineContainer').addEventListener("DOMMouseScroll", scrollHorizontally);*/
window.addEventListener("resize", initialize);

window.addEventListener("beforeunload", e => {
  (e || window.event).returnValue = rusure;
  return rusure;
});

document.onkeydown = e => {
  e = e || window.event;
  if(e.keyCode == 32) {
    songPlayPause();
  } else if(e.keyCode == 27) {
    if(isSettingsOpened) {
      selectedCntElement = {"v1": '', "v2": '', "i": ''};
      toggleSettings();
    } else {
      if(song.playing()){
        songPlayPause();
      } else {
        timelineYLoc = 0;
        song.stop();
      }
    }
  } else if(e.keyCode == 37) { //LEFT
    song.seek(song.seek() - 0.01);
    let seek = song.seek();
    song.seek(seek - (seek % (60 / bpm / split)));
  } else if(e.keyCode == 39) { //RIGHT
    song.seek(song.seek() + 0.01);
    let seek = song.seek();
    song.seek(seek + (60 / bpm / split) - (seek % (60 / bpm / split)));
    if(song.seek() >= song._duration) {
      song.seek(seek - (60 / bpm / split) + (seek % (60 / bpm / split)) - 0.01);
    }
  } else if(e.keyCode == 38) { //UP
    timelineYLoc += tmlCanvas.height / 9;
    timelineScrollCount--;
    if(timelineYLoc > 0) {
      timelineYLoc -= tmlCanvas.height / 9;
      timelineScrollCount++;
    }
  } else if(e.keyCode == 40) { //DOWN
    if(timelineElementNum > 6 && timelineScrollCount < timelineElementNum) {
      timelineYLoc -= tmlCanvas.height / 9;
      timelineScrollCount++;
    }
  } else if(e.keyCode == 46) { //DELETE
    deleteElement();
  }
  if(mode == 2) {
    if(e.keyCode == 49) {
      selectedBullet = 0;
    } else if(e.keyCode == 50) {
      selectedBullet = 1;
    }
  }
};

document.body.onmousedown = function() { 
  mouseDown = true;
}
document.body.onmouseup = function() {
  mouseDown = false;
}