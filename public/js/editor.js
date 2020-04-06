let isMenuOpened = false;
let isFileOpenerOpened = false;
let isOffsetOpened = false;
let isSettingsOpened = false;
let isInfoOpened = false;
let isSpeedOpened = false;
let isBpmOpened = false;
let isTriggerOpened = false;
let isTimelineEdited = false;
let songName = 'Select a song';
let producer = '';
let offset = 0;
let sync = 0;
let tracks;
let song;
let bpm = 130;
let speed = 1;
let zoom = 0.35;
let pattern = {
  "information": {
    "version": "1.0",
    "track": songName,
    "producer": producer,
    "bpm": bpm,
    "speed": speed,
    "offset": offset
  },
  "patterns" : [],
  "triggers" : []
};
let prevScroll = 0;
let nowScroll = 0;
let selectedTempo = 0;
let nowMilis = -1;
let isPatternPlaying = false;
let isSongPlayed = false;
let playBackRate = 1.0;
let syncSwitch = true;
let beepSwitch = true;
let selectedElement = 0; //0:circle, 1:diamond, 2: tricle
let loopCounter = 0;

const beep = new Howl({
  src: [`/sounds/beep.mp3`],
  autoplay: false,
  loop: false
});
const tempo = ["1/1", "1/2", "1/3", "1/4", "1/6", "1/8", "1/16"];
const timeline = document.getElementById("timelineCanvas");
const timelineCtx = timeline.getContext("2d");
const editor = document.getElementById("editorCanvas");
const editorCtx = timeline.getContext("2d");

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
        option.innerHTML = tracks[i].name + '.mp3';
        option.value = tracks[i].name + '.mp3';
        document.getElementById("tracks").options.add(option);
        timeline.width = document.getElementById("timeline").offsetWidth;
        timeline.height = document.getElementById("timeline").offsetHeight - 10;
      }
    } else {
      alert('Failed to load song list.');
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
});

const zoomIn = () => {
  zoom = zoom * 1.1;
  if(zoom > 0.9) {
    alert(zoomInWarn);
  }
  nowScroll = (prevScroll / (zoom / 1.1 * bpm)) * (zoom * bpm);
  prevScroll = nowScroll;
  document.getElementById("timeline").scrollLeft = parseInt(nowScroll);
  if(nowScroll == 0) {
    drawTimeline();
  }
};

const zoomOut = () => {
  zoom = zoom / 1.1;
  if(zoom < 0.13) {
    alert(zoomOutWarn);
  }
  nowScroll = (prevScroll / (zoom * 1.1 * bpm)) * (zoom * bpm);
  prevScroll = nowScroll;
  document.getElementById("timeline").scrollLeft = parseInt(nowScroll);
  if(nowScroll == 0) {
    drawTimeline();
  }
}

const tempoLeft = () => {
  selectedTempo -= 1;
  if(selectedTempo < 0) {
    selectedTempo = 0;
  } else {
    nowScroll = (zoom * bpm) * parseInt(prevScroll / (zoom * bpm));
    document.getElementById("timeline").scrollLeft = parseInt(nowScroll);
    prevScroll = nowScroll;
  }
  document.getElementById("temposplitText").textContent = tempo[selectedTempo];
  drawTimeline();
};

const tempoRight = () => {
  selectedTempo += 1;
  if(selectedTempo > 6) {
    selectedTempo = 6;
  } else {
    nowScroll = (zoom * bpm) * parseInt(prevScroll / (zoom * bpm));
    document.getElementById("timeline").scrollLeft = parseInt(nowScroll);
    prevScroll = nowScroll;
  }
  document.getElementById("temposplitText").textContent = tempo[selectedTempo];
  drawTimeline();
};

const drawTimeline = () => {
  const lineNum = parseInt(song._duration / (60 / bpm));
  const timelineWidth = (zoom * bpm) * (lineNum + 3) + (window.innerWidth / 100 * 90);
  timeline.width = timelineWidth;
  document.getElementById("nowPlayingMark").style.left = document.getElementById("bottomLeftNav").offsetWidth + (zoom * bpm) - (window.innerWidth / 350) + "px";
  const timelineHeight = timeline.height;
  const startPoint = document.getElementById("timeline").scrollLeft - (document.getElementById("timeline").scrollLeft % (zoom * bpm));
  const renderLineNum = parseInt(window.innerWidth / (zoom * bpm));
  for(let i = 1; i < renderLineNum; i++) {
    if(startPoint + (zoom * i * bpm) <= (lineNum + 4) * zoom * bpm) {
      timelineCtx.beginPath();
      if(startPoint + (zoom * i * bpm) < zoom * 5 * bpm) {
        timelineCtx.strokeStyle = "#ff6161";
      } else {
        timelineCtx.strokeStyle = "#555";
      }
      timelineCtx.moveTo(startPoint + (zoom * i * bpm), timelineHeight / 5);
      timelineCtx.lineTo(startPoint + (zoom * i * bpm), timelineHeight - (timelineHeight / 5));
      timelineCtx.stroke();
      timelineCtx.closePath();
      for(let j = 1; j < parseInt(tempo[selectedTempo].split("/")[1]); j++) {
        timelineCtx.beginPath();
        timelineCtx.strokeStyle = "#AAA";
        timelineCtx.moveTo(startPoint + (zoom * i * bpm) + (j * ((zoom * bpm) / parseInt(tempo[selectedTempo].split("/")[1]))), timelineHeight / 5);
        timelineCtx.lineTo(startPoint + (zoom * i * bpm) + (j * ((zoom * bpm) / parseInt(tempo[selectedTempo].split("/")[1]))), timelineHeight - (timelineHeight / 5));
        timelineCtx.stroke();
        timelineCtx.closePath();
      }
    }
  }
};

const timelineScrolled = (e) => {
  if(parseInt(prevScroll) < e.scrollLeft) {
    nowScroll = prevScroll + ((zoom * bpm) / parseInt(tempo[selectedTempo].split("/")[1]));
    e.scrollLeft = parseInt(nowScroll);
  } else if(parseInt(prevScroll) > e.scrollLeft) {
    nowScroll = prevScroll - ((zoom * bpm) / parseInt(tempo[selectedTempo].split("/")[1]));
    e.scrollLeft = parseInt(nowScroll);
  }
  //nowMilis = (60 / bpm) * ((nowScroll - (4 * (zoom * bpm))) / (zoom * bpm)) * 1000;
  nowMilis = (60000 * nowScroll / zoom / bpm - 240000) / bpm;
  prevScroll = nowScroll;
  drawTimeline();
};

const menu = () => {
  if(isMenuOpened) {
    document.getElementById("menu").style.display = 'none';
    isMenuOpened = false;
  } else {
    if(isFileOpenerOpened) {
      document.getElementById("fileOpener").style.display = 'none';
      isFileOpenerOpened = false;
    } else {
      if(isOffsetOpened) {
        document.getElementById("offsetContainer").style.display = 'none';
        isOffsetOpened = false;
      } else {
        document.getElementById("menu").style.display = 'block';
        isMenuOpened = true;
      }
    }
  }
};

const exit = () => {
  window.location.href = `${url}/game`;
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
  pattern.information = {
    "version": "1.0",
    "track": songName,
    "producer": producer,
    "bpm": bpm,
    "speed": speed,
    "offset": offset
  }
  let a = document.createElement("a");
  let file = new Blob([JSON.stringify(pattern)], {type: 'application/json'});
  a.href = URL.createObjectURL(file);
  a.download = `${songName}.json`;
  a.click();
};

const offsetOpen = () => {
  document.getElementById("menu").style.display = 'none';
  isMenuOpened = false;
  document.getElementById("offsetContainer").style.display = 'block';
  isOffsetOpened = true;
};

const offsetChanged = (e) => {
  offset = parseInt(e.value);
};

const titleChanged = (e) => {
  document.getElementById("songName").innerText = e.value;
  songName = e.value;
};

const producerChanged = (e) => {
  producer = e.value;
};

const openSettings = () => {
  if(isInfoOpened) {
    document.getElementById("info").style.display = 'none';
    isInfoOpened = false;
  }
  if(isSettingsOpened) {
    document.getElementById("settings").style.display = 'none';
    isSettingsOpened = false;
  } else {
    document.getElementById("settings").style.display = 'block';
    isSettingsOpened = true;
  }
};

const openInfo = () => {
  if(isSettingsOpened) {
    document.getElementById("settings").style.display = 'none';
    isSettingsOpened = false;
  }
  if(isInfoOpened) {
    document.getElementById("info").style.display = 'none';
    isInfoOpened = false;
  } else {
    document.getElementById("info").style.display = 'block';
    isInfoOpened = true;
  }
};

const showTrigger = () => {
  if(isTriggerOpened) {
    document.getElementById("triggerContainer").style.display = 'none';
    isTriggerOpened = false;
  } else {
    document.getElementById("triggerContainer").style.display = 'initial';
    isTriggerOpened = true;
  }
};

const musicSelected = (e) => {
  if(isTimelineEdited) {
    if(confirm(initSure)) {
      if(e.options[0].value == '-') {
        e.remove(0);
      }
      if(isSongPlayed == true) {
        song.stop();
      }
      isPatternPlaying = false;
      isSongPlayed = false;
      song = new Howl({
        src: [`${cdnUrl}/tracks/128kbps/${e.options[e.selectedIndex].value}`],
        autoplay: false,
        loop: false,
        onend: () => {
          song.stop();
          isPatternPlaying = false;
          isSongPlayed = false;
        },
        onload: () => {
          document.getElementById("lengthOfSong").textContent = `${parseInt(song._duration / 60)}m ${parseInt(song._duration % 60)}s`;
          document.getElementById("songName").textContent = tracks[e.selectedIndex].name;
          drawTimeline();
        }
      });
      musicInit(e.selectedIndex);
    }
  } else {
    if(e.options[0].value == '-') {
      e.remove(0);
    }
    if(isSongPlayed == true) {
      song.stop();
    }
    isPatternPlaying = false;
    isSongPlayed = false;
    song = new Howl({
      src: [`${cdnUrl}/tracks/128kbps/${e.options[e.selectedIndex].value}`],
      autoplay: false,
      loop: false,
      onend: () => {
        song.stop();
        isPatternPlaying = false;
        isSongPlayed = false;
      },
      onload: () => {
        document.getElementById("lengthOfSong").textContent = `${parseInt(song._duration / 60)}m ${parseInt(song._duration % 60)}s`;
        document.getElementById("songName").textContent = tracks[e.selectedIndex].name;
        drawTimeline();
      }
    });
    musicInit(e.selectedIndex);
  }
  if(isPatternPlaying == true) {
    if(isSongPlayed == true) {
      song.stop();
    }
    isPatternPlaying = false;
    isSongPlayed = false;
  }
};

const musicInit = (index) => {
  songName = tracks[index].name;
  document.getElementById("songName").textContent = tracks[index].name + '(loading)';
  document.getElementById("titleField").value = tracks[index].name;
  document.getElementById("producerField").value = tracks[index].producer;
  document.getElementById("bpmField").textContent = tracks[index].bpm;
  document.getElementById("bpmTextField").value = tracks[index].bpm;
  document.getElementById("background").style.backgroundImage = `url('/images/album/${tracks[index].name}.png')`;
  bpm = tracks[index].bpm;
  producer = tracks[index].producer;
  prevScroll = 0;
  nowScroll = 0;
  nowMilis = -1;
  document.getElementById("timeline").scrollLeft = 0;
  playBackRate = 1.0;
  document.getElementById('playbackrateText').textContent = playBackRate * 100 + "%";
  song.rate(playBackRate);
};

const speedShow = () => {
  if(isSpeedOpened) {
    document.getElementById("speedFieldContainer").style.display = 'none';
    isSpeedOpened = false;
  } else {
    document.getElementById("speedFieldContainer").style.display = 'flex';
    isSpeedOpened = true;
  }
};

const speedSelected = (e) => {
  document.getElementById("speedField").innerText = e.options[e.selectedIndex].value + 'x';
  speed = parseInt(e.options[e.selectedIndex].value);
};

const bpmShow = () => {
  if(isBpmOpened) {
    document.getElementById("bpmFieldContainer").style.display = 'none';
    isBpmOpened = false;
  } else {
    document.getElementById("bpmFieldContainer").style.display = 'flex';
    isBpmOpened = true;
  }
};

const bpmChanged = (e) => {
  document.getElementById("bpmField").innerText = e.value;
  bpm = parseInt(e.value);
  if(nowScroll != 0) {
    prevScroll = 0;
    nowScroll = 0;
    nowMilis = 0;
    document.getElementById("timeline").scrollLeft = 0;
  } else {
    drawTimeline();
  }
  if(isPatternPlaying == true) {
    if(isSongPlayed == true) {
      song.stop();
    }
    isPatternPlaying = false;
    isSongPlayed = false;
  }
};

const scrollHorizontally = (e) => {
  e = window.event || e;
  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  document.getElementById('timeline').scrollLeft -= (delta*30);
  e.preventDefault();
};

const playLoop = () => {
  if(isPatternPlaying == true) {
    if(nowMilis >= 0 && isSongPlayed == false) {
      song.seek((offset + nowMilis) / 1000);
      song.play();
      isSongPlayed = true;
    }
    document.getElementById('timeline').scrollLeft = parseInt(prevScroll + (zoom * bpm));
    if(syncSwitch == true) {
      song.seek((offset + nowMilis) / 1000);
    } else {
      loopCounter += 1;
      if(loopCounter >= 16) {
        song.seek((offset + nowMilis) / 1000);
        loopCounter = 0;
      }
    }
    if(beepSwitch) {
      beep.stop();
      beep.seek(0);
      beep.play();
    }
    setTimeout(playLoop, 60000 / bpm / playBackRate / parseInt(tempo[selectedTempo].split("/")[1]));
  }
};

const playPattern = () => {
  if(isPatternPlaying == false) {
    isPatternPlaying = true;
    playLoop();
  }
};

const stopPattern = () => {
  if(isPatternPlaying == true) {
    if(isSongPlayed == true) {
      song.stop();
    }
    isPatternPlaying = false;
    isSongPlayed = false;
  } else {
    prevScroll = 0;
    nowScroll = 0;
    nowMilis = -1;
    document.getElementById("timeline").scrollLeft = 0;
  }
};

const rateChange = () => {
  if(playBackRate == 1.0) {
    playBackRate = 2.0;
  } else if(playBackRate == 2.0) {
    playBackRate = 0.5;
  } else if(playBackRate == 0.5) {
    playBackRate = 0.75;
  } else if(playBackRate == 0.75) {
    playBackRate = 1.0;
  }
  document.getElementById('playbackrateText').textContent = playBackRate * 100 + "%";
  song.rate(playBackRate);
};

const syncChanged = (e) => {
  if(syncSwitch) {
    document.getElementById("syncWarning").style.display = 'inline-block';
  } else {
    document.getElementById("syncWarning").style.display = 'none';
  }
  syncSwitch = e.checked;
};

const beepChanged = (e) => {
  beepSwitch = e.checked;
};

document.getElementById('timeline').addEventListener("mousewheel", scrollHorizontally);
document.getElementById('timeline').addEventListener("DOMMouseScroll", scrollHorizontally);

window.addEventListener("beforeunload", function (e) {
  (e || window.event).returnValue = rusure;
  return rusure;
});