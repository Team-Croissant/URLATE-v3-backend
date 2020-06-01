const cntCanvas = document.getElementById('componentCanvas');
const cntCtx = cntCanvas.getContext("2d");
const tmlCanvas = document.getElementById('timelineCanvas');
const tmlCtx = tmlCanvas.getContext("2d");
let settings, tracks, song, bpm = 130, speed = 2, offset = 0, sync = 0;
let mouseX = 0, mouseY = 0;
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
let selectedCntElement = {"v1": '', "v2": '', "i": ''};
let circleBulletAngles = [];

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
    src: [`${cdnUrl}/tracks/${settings.sound.quality}/${tracks[songSelectBox.selectedIndex].fileName}.mp3`],
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
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[4].value = 2;
  trackSettings.getElementsByClassName('settingsPropertiesTextbox')[5].value = 0;
  bpm = tracks[songSelectBox.selectedIndex].bpm;
  offset = 0;
  speed = 2;
  document.getElementById('canvasBackgroundImage').style.backgroundImage = `url(${cdnUrl}/albums/${tracks[songSelectBox.selectedIndex].fileName}.png)`;
  document.getElementById('songSelectionContainer').style.display = 'none';
  document.getElementById('initialScreenContainer').style.display = 'none';
  document.getElementById('editorMainContainer').style.display = 'initial';
  window.requestAnimationFrame(cntRender);
};

const toggleSettings = () => {
  if(isSettingsOpened) {
    document.getElementById('settingsContainer').style.display = 'none';
    document.getElementById('timelineContainer').style.width = '100vw';
    tmlCanvas.style.width = '100vw';
    tmlCanvas.width = window.innerWidth;
  } else {
    document.getElementById('settingsContainer').style.display = 'flex';
    document.getElementById('timelineContainer').style.width = '80vw';
    tmlCanvas.style.width = '80vw';
    tmlCanvas.width = window.innerWidth * 0.80;
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
  p = Math.max(p, 0);
  x = cntCanvas.width / 200 * (x + 100);
  y = cntCanvas.height / 200 * (y + 100);
  let w = cntCanvas.width / 40;
  let grd = cntCtx.createLinearGradient(x - w, y - w, x + w, y + w);
  let opacity = 1;
  if(p > 100) {
    opacity = (130 - p) / 130;
  }
  grd.addColorStop(0, `rgba(251, 73, 52, ${opacity})`);
  grd.addColorStop(1, `rgba(235, 217, 52, ${opacity})`);
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

const drawBullet = (n, x, y, a) => {
  x = cntCanvas.width / 200 * (x + 100);
  y = cntCanvas.height / 200 * (y + 100);
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

const gotoMain = (isCalledByMain) => {
  if(isCalledByMain || confirm(rusure)) {
    document.getElementById('initialScreenContainer').style.display = 'block';
    document.getElementById('initialButtonsContainer').style.display = 'flex';
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

const trackMouseSelection = (i, v1, v2, x, y) => {

};

const cntRender = (e) => {
  selectedCntElement = {"v1": '', "v2": '', "i": ''};
  window.requestAnimationFrame(cntRender);
  const seek = song.seek() - (offset + sync) / 1000;
  let start = lowerBound(pattern.patterns, seek * 1000 - (bpm * 4 / speed));
  let end = upperBound(pattern.patterns, seek * 1000 + (bpm * 14 / speed));
  const renderNotes = pattern.patterns.slice(start, end);
  eraseCanvas();
  for(let i = 0; i < renderNotes.length; i++) {
    const p = ((bpm * 14 / speed) - (renderNotes[i].ms - (seek * 1000))) / (bpm * 14 / speed) * 100;
    drawNote(p, renderNotes[i].x, renderNotes[i].y);
    trackMouseSelection(start + i, 0, renderNotes[i].value, renderNotes[i].x, renderNotes[i].y);
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
      drawBullet(renderBullets[i].value, x, y, renderBullets[i].angle + (left ? 0 : 180));
    } else {
      if(!circleBulletAngles[start+i]) circleBulletAngles[start+i] = calcAngleDegrees((left ? -100 : 100) - mouseX, renderBullets[i].location - mouseY);
      if(!left) console.log(circleBulletAngles[start+i]);
      if(left) {
        if(110 > circleBulletAngles[start+i] && circleBulletAngles[start+i] > 0) circleBulletAngles[start+i] = 110;
        else if(0 > circleBulletAngles[start+i] && circleBulletAngles[start+i] > -110) circleBulletAngles[start+i] = -110;
      } else {
        if(70 < circleBulletAngles[start+i] && circleBulletAngles[start+i] > 0) circleBulletAngles[start+i] = 70;
        else if(0 > circleBulletAngles[start+i] && circleBulletAngles[start+i] < -70) circleBulletAngles[start+i] = -70;
      }
      y = renderBullets[i].location + p * getTan(circleBulletAngles[start+i]) * (left ? 1 : -1);
      drawBullet(renderBullets[i].value, x, y);
    }
    trackMouseSelection(start + i, 1, renderBullets[i].value, x, y);
  }
};

const songControl = () => {
  if(document.getElementById('editorMainContainer').style.display == 'initial') {
    if(song.playing()){
      song.pause();
    } else {
      circleBulletAngles = [];
      song.seek(song.seek() + (offset + sync) / 1000);
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

const changeBPM = () => {
  window.requestAnimationFrame(() => {
    bpm = Number(trackSettings.getElementsByClassName('settingsPropertiesTextbox')[3].value);
  });
};

const changeSpeed = () => {
  window.requestAnimationFrame(() => {
    speed = Number(trackSettings.getElementsByClassName('settingsPropertiesTextbox')[4].value);
  });
};

const changeOffset = () => {
  window.requestAnimationFrame(() => {
    offset = Number(trackSettings.getElementsByClassName('settingsPropertiesTextbox')[5].value);
  });
};

const trackMousePos = (event) => {
  const width = parseInt((componentView.offsetWidth - canvasContainer.offsetWidth) / 2 + menuContainer.offsetWidth);
  const height = navbar.offsetHeight;
  const x = (event.clientX - width) / canvasContainer.offsetWidth * 200 - 100;
  const y = (event.clientY - height) / canvasContainer.offsetHeight * 200 - 100;
  if(!(x < -100 || y < -100 || x > 100 || y > 100)) {
    mouseX = x;
    mouseY = y;
  }
}

const compClicked = () => {
  console.log(mouseX + ',' +  mouseY);
}

const scrollHorizontally = e => {
  e = window.event || e;
  let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  document.getElementById('timelineContainer').scrollLeft -= (delta * 30);
  e.preventDefault();
};

document.getElementById('timelineContainer').addEventListener("mousewheel", scrollHorizontally);
document.getElementById('timelineContainer').addEventListener("DOMMouseScroll", scrollHorizontally);
window.addEventListener("resize", initialize);

window.addEventListener("beforeunload", e => {
  (e || window.event).returnValue = rusure;
  return rusure;
});

document.onkeypress = e => {
  if(e.keyCode == 32) {
    songControl();
  }
};