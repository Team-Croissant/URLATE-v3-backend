let selection = 0;
let selectionList = ['menuMain', 'menuEditor', 'menuAdvanced'];
let display = 0;
let username = '';
let analyser, dataArray;
let canvas = document.getElementById("renderer");
let ctx = canvas.getContext("2d");
let bars = 100;

//volume need to 0.1~0.8
const songs = new Howl({
  src: [`${cdn}/tracks/192kbps/urlate_theme.mp3`],
  autoplay: false,
  loop: true,
  onend: () => {}
});

const initialize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
  initialize();
};

const drawBar = (x1, y1, x2, y2, width, frequency) => {
  frequency = frequency / 1.5 + 85;
  if(frequency > 180) {
    frequency = 180;
  } else if(frequency < 150) {
    frequency = 150;
  }
  lineColor = `rgb(${frequency}, ${frequency}, ${frequency})`;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
};

const animationLooper = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let barWidth = window.innerHeight / bars;
  analyser.getByteFrequencyData(dataArray);
  dataLimit = 130 + Howler.volume() * 110;
  for(let i = 0; i < bars; i++) {
    let barHeight = dataArray[i] * window.innerHeight / 500;
    let y = barWidth * i;
    let x_end = barHeight / 1.3;
    drawBar(0, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  for(let i = 0; i < bars; i++) {
    let barHeight = dataArray[i] * window.innerHeight / 500;
    let y = window.innerHeight - barWidth * i;
    let x_end = window.innerWidth - (barHeight / 1.3);
    drawBar(window.innerWidth, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  window.requestAnimationFrame(animationLooper);
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
          username = data.nickname;
          userid = data.userid;
          document.getElementById('name').textContent = username;
          if(data.advanced) {
            urlateText.innerHTML = '<strong>URLATE</strong> Advanced';
            registerBtn.value = registered;
            registerBtn.style.background = '#444';
          }
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

window.onload = () => {
  analyser = Howler.ctx.createAnalyser();
  Howler.masterGain.connect(analyser);
  analyser.connect(Howler.ctx.destination);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  animationLooper();
};

Pace.on('done', () => {
  // songs.play();
  const nameStyle = window.getComputedStyle(document.getElementById("name"), null);
  const nameWidth = parseFloat(nameStyle.getPropertyValue("width"));
  if(nameWidth > 265) {
    document.getElementById("name").style.fontSize = "2.2vh";
    document.getElementById("name").style.paddingLeft = "2.5vw";
  } else if(nameWidth > 200) {
    document.getElementById("name").style.fontSize = "2.3vh";
    document.getElementById("name").style.paddingLeft = "4vw";
  } else if(nameWidth > 180) {
    document.getElementById("name").style.fontSize = "2.5vh";
  }
  document.getElementById("menuContainer").style.display = "flex";
  document.getElementById("loadingContainer").classList.toggle("fadeOut");
  setTimeout(() => {
    document.getElementById("loadingContainer").style.display = "none";
    document.getElementById("menuContainer").classList.toggle("loaded");
    document.getElementById("urlateText").style.fontSize = "1em";
    document.getElementById("urlateText").style.marginBottom = "0";
    document.getElementById("songName").style.fontSize = "1.8em";
    document.getElementById("header").classList.toggle("fadeIn");
    setTimeout(() => {
      let backIcons = document.getElementsByClassName("backIcon");
      for (let i = 0; i < backIcons.length; i++) {
        backIcons[i].classList.add('show');
      }
      document.getElementById("songName").classList.toggle("fadeIn");
    });
    document.getElementById("footerLeft").classList.toggle("fadeIn");
  }, 500);
});

const menuLeft = () => {
  document.getElementById(selectionList[selection]).style.display = "none";
  selection--;
  if(selection < 0) {
    selection = selectionList.length - 1;
  }
  document.getElementById(selectionList[selection]).style.display = "flex";
};

const menuRight = () => {
  document.getElementById(selectionList[selection]).style.display = "none";
  selection++;
  if(selection > selectionList.length - 1) {
    selection = 0;
  }
  document.getElementById(selectionList[selection]).style.display = "flex";
};

const infoScreen = () => {
  display = 4;
  document.getElementById("infoContainer").style.display = "block";
  document.getElementById("infoContainer").classList.toggle("fadeIn");
};

const displayClose = () => {
  if(display == 1) {
    //PLAY
    document.getElementById("selectContainer").classList.remove("fadeIn");
    document.getElementById("selectContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("selectContainer").classList.remove("fadeOut");
      document.getElementById("selectContainer").style.display = "none";
    }, 500);
  } else if(display == 2) {
    //Settings
  } else if(display == 3) {
    //ADVANCED
    document.getElementById("advancedContainer").classList.remove("fadeIn");
    document.getElementById("advancedContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("advancedContainer").classList.remove("fadeOut");
      document.getElementById("advancedContainer").style.display = "none";
    }, 500);
  } else if(display == 4) {
    //Info
    document.getElementById("infoContainer").classList.remove("fadeIn");
    document.getElementById("infoContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("infoContainer").classList.remove("fadeOut");
      document.getElementById("infoContainer").style.display = "none";
    }, 500);
  }
  display = 0;
};

const menuSelected = () => {
  if(selection == 0) {
    //play
    menu0Selected();
  } else if(selection == 1) {
    //editor
    menu1Selected();
  } else if(selection == 2) {
    //advanced
    menu2Selected();
  }
};

const menu0Selected = () => {
  display = 1;
  document.getElementById("selectContainer").style.display = "block";
  document.getElementById("selectContainer").classList.add("fadeIn");
};

const menu1Selected = () => {
  window.location.href = `${url}/editor`;
};

const menu2Selected = () => {
  //advanced
  display = 3;
  document.getElementById("advancedContainer").style.display = "block";
  document.getElementById("advancedContainer").classList.add("fadeIn");
};

const getAdvanced = () => {
  advancedPurchasing.style.pointerEvents = "all";
  advancedPurchasing.style.opacity = "1";
  fetch(`${api}/xsolla/getToken`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      type: 'advanced'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then((data) => {
    window.location.href = `https://sandbox-secure.xsolla.com/paystation3/?access_token=${data.token}`;
  }).catch((error) => {
    advancedPurchasing.style.pointerEvents = "none";
    advancedPurchasing.style.opacity = "0";
    alert(`Error occured.\n${error}`);
  });
};

window.addEventListener("resize", initialize);