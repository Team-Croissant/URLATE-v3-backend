let selection = 0;
let selectionList = ['menuMain', 'menuEditor', 'menuAdvanced'];
let display = 0;
let username = '';
let analyser, dataArray;

//volume need to 0.1~0.8
const songs = new Howl({
  src: [`${cdn}/tracks/192kbps/MyRhy Theme.mp3`],
  autoplay: false,
  loop: true,
  onend: () => {}
});

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
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

let milis = 0;
let isBoom = false;
const animationLooper = () => {
  bars = 100;
  barWidth = window.innerHeight / bars;
  canvas = document.getElementById("renderer");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");  
  analyser.getByteFrequencyData(dataArray);
  dataLimit = 130 + Howler.volume() * 110;
  d = new Date();
  if(dataArray[1] > dataLimit && d.getTime() - milis > 100 && isBoom == false) {
    milis = d.getTime();
    document.getElementById('visualizer').classList.toggle("boom");
    isBoom = true;
  } else if(dataArray[1] < dataLimit && d.getTime() - milis && isBoom == true) {
    milis = d.getTime();
    document.getElementById('visualizer').classList.toggle("boom");
    isBoom = false;
  }
  for(let i = 0; i < bars; i++){
    barHeight = dataArray[i] * window.innerHeight / 500;
    y = barWidth * i;
    x = 0;
    x_end = barHeight / 1.3;
    drawBar(x, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  for(let i = 0; i < bars; i++){
    barHeight = dataArray[i] * window.innerHeight / 500;
    y = window.innerHeight - barWidth * i;
    x = window.innerWidth;
    x_end = window.innerWidth - (barHeight / 1.3);
    drawBar(x, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
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
  songs.play();
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
    document.getElementById("myrhyText").style.fontSize = "1em";
    document.getElementById("myrhyText").style.marginBottom = "0";
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
  infoInit();
  document.getElementById("infoContainer").style.display = "block";
  document.getElementById("infoContainer").classList.toggle("fadeIn");
};

const displayClose = () => {
  if(display == 1) {
    //PLAY
  } else if(display == 2) {
    //Settings
  } else if(display == 3) {
    //ADVANCED
    document.getElementById("advancedContainer").classList.remove("fadeIn");
    document.getElementById("advancedContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("advancedContainer").classList.remove("fadeOut");
      advancedInit();
    }, 500);
  } else if(display == 4) {
    //Info
    document.getElementById("infoContainer").classList.remove("fadeIn");
    document.getElementById("infoContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("infoContainer").classList.remove("fadeOut");
      infoInit();
    }, 500);
  }
  display = 0;
};

const advancedInit = () => {
  document.getElementById('advancedContainer').style.display = "none";
  document.getElementById('advancedContainer').style.opacity = "0";
  document.getElementById('advancedIcon').style.marginTop = "10vh";
  document.getElementById('advancedIcon').style.opacity = "0";
  document.getElementById('advancedDescription').style.opacity = "0";
  document.getElementById('advancedSupport').style.opacity = "0";
  document.getElementById('supportDetails').style.opacity = "0";
  document.getElementById('advancedDetails').style.opacity = "0";
  document.getElementById('tableContainer').style.opacity = "0";
  for (let i = 0; i < document.getElementsByClassName('advancedDetails').length; i++) {
    document.getElementsByClassName('advancedDetails')[i].style.opacity = "0";
  }
};

const infoInit = () => {
  document.getElementById('infoContainer').style.display = "none";
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
  window.location.href = `${url}/proto?track=Chatty%20Bones%202018&difficulty=1`;
};

const menu1Selected = () => {
  window.location.href = `${url}/editor`;
};

const menu2Selected = async () => {
  //advanced
  advancedInit();
  display = 3;
  document.getElementById('advancedContainer').style.display = "block";
  await new Promise((resolve) => {
    document.getElementById("advancedContainer").classList.add("fadeIn");
    setTimeout(resolve, 500);
  });
  await new Promise((resolve) => {
    document.getElementById('advancedIcon').style.marginTop = "5vh";
    document.getElementById('advancedIcon').style.opacity = 1;
    setTimeout(resolve, 1000);
  });
  await new Promise((resolve) => {
    document.getElementById("advancedDescription").classList.add("fadeIn");
    setTimeout(resolve, 500);
  });
  await new Promise((resolve) => {
    document.getElementById("advancedSupport").classList.add("shortFadeIn");
    setTimeout(resolve, 200);
  });
  await new Promise((resolve) => {
    document.getElementById("supportDetails").classList.add("shortFadeIn");
    setTimeout(resolve, 200);
  });
  await new Promise((resolve) => {
    document.getElementById("advancedDetails").classList.add("shortFadeIn");
    setTimeout(resolve, 200);
  });
  await new Promise((resolve) => {
    document.getElementById("tableContainer").classList.add("shortFadeIn");
    setTimeout(resolve, 200);
  });

  const advancedDetails = document.getElementsByClassName('advancedDetails');
  for (let i = 0; i < advancedDetails.length; i++) {
    setTimeout(() => {
      advancedDetails[i].classList.add("shortFadeIn");
    }, 200 * i);
  }
};