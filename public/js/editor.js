let isMenuOpened = false;
let isFileOpenerOpened = false;
let isOffsetOpened = false;
let isSettingsOpened = false;
let songName = 'Select a song';
let producer = '';
let offset = 0;
let sync = 0;
let tracks;
let song;
let bpm = 130;
let speed = 1;
let pattern = {
  "information": {
    "version": "1.0",
    "track": songName,
    "producer": producer,
    "bpm": bpm,
    "speed": speed,
    "offset": offset
  },
  "patterns" : []
};

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
  sync = parseInt(settings.sound.offset);
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
      }
    } else {
      alert('Failed to load song list.');
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
  if(isSettingsOpened) {
    document.getElementById("settings").style.display = 'none';
    isSettingsOpened = false;
  } else {
    document.getElementById("settings").style.display = 'block';
    isSettingsOpened = true;
  }
};

const musicSelected = (e) => {
  if(e.options[0].value == '-') {
    e.remove(0);
  }
  song = new Howl({
    src: [`${cdnUrl}/tracks/192kbps/${e.options[e.selectedIndex].value}`],
    autoplay: false,
    loop: false,
    onend: () => {}
  });
  musicInit(e.selectedIndex);
};

const musicInit = (index) => {
  songName = tracks[index].name;
  document.getElementById("songName").innerText = tracks[index].name;
  document.getElementById("titleField").value = tracks[index].name;
  document.getElementById("producerField").value = tracks[index].producer;
  document.getElementById("bpmField").innerText = tracks[index].bpm;
  document.getElementById("bpmTextField").value = tracks[index].bpm;
  document.getElementById("background").style.backgroundImage = `url('/images/album/${tracks[index].name}.png')`;
  bpm = tracks[index].bpm;
  producer = tracks[index].producer;
};

const speedShow = () => {
  document.getElementById("speedFieldContainer").style.pointerEvents = 'auto';
  document.getElementById("speedFieldContainer").style.opacity = 1;
};

const speedSelected = (e) => {
  document.getElementById("speedField").innerText = e.options[e.selectedIndex].value + 'x';
  speed = parseInt(e.options[e.selectedIndex].value);
};

const speedClose = () => {
  document.getElementById("speedFieldContainer").style.pointerEvents = 'none';
  document.getElementById("speedFieldContainer").style.opacity = 0;
};

const bpmShow = () => {
  document.getElementById("bpmFieldContainer").style.pointerEvents = 'auto';
  document.getElementById("bpmFieldContainer").style.opacity = 1;
};

const bpmClose = () => {
  document.getElementById("bpmFieldContainer").style.pointerEvents = 'none';
  document.getElementById("bpmFieldContainer").style.opacity = 0;
};

const bpmChanged = (e) => {
  document.getElementById("bpmField").innerText = e.value;
  bpm = parseInt(e.value);
};

const scrollHorizontally = (e) => {
  e = window.event || e;
  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  document.getElementById('timeline').scrollLeft -= (delta*30);
  e.preventDefault();
};

document.getElementById('timeline').addEventListener("mousewheel", scrollHorizontally, false);
document.getElementById('timeline').addEventListener("DOMMouseScroll", scrollHorizontally, false);

window.addEventListener("beforeunload", function (e) {
  (e || window.event).returnValue = rusure;
  return rusure;
});