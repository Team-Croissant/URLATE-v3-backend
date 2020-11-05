let selection = 0;
let selectionList = ['menuMain', 'menuEditor', 'menuAdvanced'];
let display = 0;
let username = '';
let analyser, dataArray;
let canvas = document.getElementById("renderer");
let ctx = canvas.getContext("2d");
let bars = 100;
let loaded = 0;
let songSelection = -1;
let difficultySelection = 0;
let difficulties = [1,5,10];
let bulletDensities = [10,50,100];
let noteDensities = [10,50,100];
let speeds = [1,2,3];
let bpm = 130;

let trackRecords = [];

let themeSong;
let songs = [];

const initialize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

function convertWordArrayToUint8Array(wordArray) {
  let arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
  let length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
  let uInt8Array = new Uint8Array(length), index=0, word, i;
  for(i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
  }
  return uInt8Array;
}

const settingApply = () => {
  if(settings.general.detailLang == "original") {
    langDetailSelector.getElementsByTagName('option')[0].selected = true;
  } else if(settings.general.detailLang == "english") {
    langDetailSelector.getElementsByTagName('option')[1].selected = true;
  }
  if(settings.display.canvasRes == 100) {
    canvasResSelector.getElementsByTagName('option')[0].selected = true;
  } else if(settings.display.canvasRes == 75) {
    canvasResSelector.getElementsByTagName('option')[1].selected = true;
  } else if(settings.display.canvasRes == 50) {
    canvasResSelector.getElementsByTagName('option')[2].selected = true;
  } else if(settings.display.canvasRes == 25) {
    canvasResSelector.getElementsByTagName('option')[3].selected = true;
  }
  if(settings.display.albumRes == 100) {
    albumResSelector.getElementsByTagName('option')[0].selected = true;
  } else if(settings.display.albumRes == 75) {
    albumResSelector.getElementsByTagName('option')[1].selected = true;
  } else if(settings.display.albumRes == 50) {
    albumResSelector.getElementsByTagName('option')[2].selected = true;
  }
  if(settings.sound.res == "96kbps") {
    soundResSelector.getElementsByTagName('option')[0].selected = true;
  } else if(settings.sound.res == "128kbps") {
    soundResSelector.getElementsByTagName('option')[1].selected = true;
  } else if(settings.sound.res == "192kbps") {
    soundResSelector.getElementsByTagName('option')[2].selected = true;
  }
  if(settings.game.comboCount == 10) {
    comboSelector.getElementsByTagName('option')[0].selected = true;
  } else if(settings.game.comboCount == 25) {
    comboSelector.getElementsByTagName('option')[1].selected = true;
  } else if(settings.game.comboCount == 50) {
    comboSelector.getElementsByTagName('option')[2].selected = true;
  } else if(settings.game.comboCount == 100) {
    comboSelector.getElementsByTagName('option')[3].selected = true;
  } else if(settings.game.comboCount == 200) {
    comboSelector.getElementsByTagName('option')[4].selected = true;
  }
  for(let i = 0; i < skinSelector.getElementsByTagName('option').length; i++) {
    if(skinSelector.getElementsByTagName('option')[i].value == settings.game.skin) {
      skinSelector.getElementsByTagName('option')[i].selected = true;
      break;
    }
  }
  inputSelector.getElementsByTagName('option')[Number(settings.input.keys)].selected = true;
  volumeMaster.value = settings.sound.volume.master * 100;
  volumeSong.value = settings.sound.volume.music * 100;
  volumeHit.value = settings.sound.volume.hitSound * 100;
  inputSensitive.value = settings.input.sens * 100;
  inputSize.value = settings.game.size * 10;
  mouseCheck.checked = settings.input.mouse;
  judgeSkin.checked = settings.game.judgeSkin;
  judgePerfect.checked = settings.game.applyJudge.Perfect;
  judgeGreat.checked = settings.game.applyJudge.Great;
  judgeGood.checked = settings.game.applyJudge.Good;
  judgeBad.checked = settings.game.applyJudge.Bad;
  judgeMiss.checked = settings.game.applyJudge.Miss;
  // judgeBullet.checked = settings.game.applyJudge.Bullet;
  frameCheck.checked = settings.game.counter;
  ignoreCursorCheck.checked = settings.editor.denyCursor;
  ignoreEditorCheck.checked = settings.editor.denySkin;
  ignoreTestCheck.checked = settings.editor.denyAtTest;
  comboAlertCheck.checked = settings.game.comboAlert;
  volumeMasterValue.textContent = settings.sound.volume.master * 100 + '%';
  volumeSongValue.textContent = settings.sound.volume.music * 100 + '%';
  volumeHitValue.textContent = settings.sound.volume.hitSound * 100 + '%';
  volumeEftValue.textContent = settings.sound.volume.effect * 100 + '%';
  offsetButton.textContent = settings.sound.offset + 'ms';
  sensitiveValue.textContent = settings.input.sens + 'x';
  inputSizeValue.textContent = settings.game.size + 'x';
  initialize();
  themeSong = new Howl({
    src: [`${cdn}/tracks/${settings.sound.res}/urlate_theme.mp3`],
    format: ['mp3'],
    autoplay: false,
    loop: true,
    onload: () => {
      if(loaded) {
        gameLoaded();
      }
      loaded = 1;
      Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
      themeSong.play();
    }
  });
};

const drawBar = (x1, y1, x2, y2, width) => {
  lineColor = 'rgb(0, 0, 0)';
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
};

const animationLooper = () => {
  let width = canvas.width;
  let height = canvas.height;
  let wWidth = window.innerWidth;
  let wHeight = window.innerHeight;
  ctx.clearRect(0, 0, width, height);
  let barWidth = wHeight / bars;
  analyser.getByteFrequencyData(dataArray);
  for(let i = 0; i < bars; i++) {
    let barHeight = dataArray[i] * wHeight / 550;
    let y = barWidth * i;
    let x_end = barHeight / 1.3;
    drawBar(0, y, x_end, y, barWidth - (barWidth / 2));
    y = wHeight - y;
    drawBar(wWidth, y, wWidth - x_end, y, barWidth - (barWidth / 2));
  }
  requestAnimationFrame(animationLooper);
};

const sortAsName = (a, b) => {
  if(a.name == b.name) return 0;
  return a.name > b.name ? 1 : -1;
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
          document.getElementById('optionName').textContent = username;
          if(lang == 'ko') {
            langSelector.getElementsByTagName('option')[0].selected = true;
          } else if(lang == 'en') {
            langSelector.getElementsByTagName('option')[1].selected = true;
          }
          if(data.advanced) {
            document.getElementById('optionAdvanced').textContent = enabled;
            urlateText.innerHTML = '<strong>URLATE</strong> Advanced';
            registerBtn.value = registered;
            registerBtn.style.background = '#444';
            let elements = document.getElementsByClassName('advancedOnly');
            for(let i = 0; i < elements.length; i++) {
              elements[i].style.display = 'flex';
            }
          }
          let skins = JSON.parse(data.skins).skins;
          for(let i = 0; i < skins.length; i++) {
            let option = document.createElement('option');
            option.appendChild(document.createTextNode(skins[i]));
            skinSelector.appendChild(option); 
          }
          settingApply();
          fetch(`${api}/getTracks`, {
            method: 'GET',
            credentials: 'include'
          })
          .then(res => res.json())
          .then((data) => {
            if(data.result == 'success') {
              tracks = data.tracks;
              tracks.sort(sortAsName);
              let songList = '';
              for(let i = 0; i < tracks.length; i++) {
                songs[i] = new Howl({
                  src: [`https://cdn.rhyga.me/tracks/preview/${tracks[i].fileName}.mp3`],
                  format: ['mp3'],
                  autoplay: false,
                  loop: true
                });
                songList += `<div class="songSelectionContainer" onclick="songSelected(${i})">
                                <div class="songSelectionInfo">
                                    <span class="songSelectionTitle">${(settings.general.detailLang == 'original') ? tracks[i].original_name : tracks[i].name}</span>
                                    <span class="songSelectionArtist">${tracks[i].producer}</span>
                                </div>
                                <div class="songSelectionRank">
                                    <span class="ranks rankQ"></span>
                                </div>
                            </div>`;
                fetch(`${api}/getRecord/${tracks[i].name}/${username}`, {
                  method: 'GET',
                  credentials: 'include'
                })
                .then(res => res.json())
                .then((data) => {
                  trackRecords[i] = [];
                  if(data.result == "success") {
                    for(let j = 0; j < 3; j++) {
                      if(data.results[j] != undefined) {
                        let value = data.results[j];
                        document.getElementsByClassName('ranks')[i].className = "ranks";
                        document.getElementsByClassName('ranks')[i].classList.add(`rank${value.rank}`);
                        trackRecords[i][j] = {"rank": `rank${value.rank}`, "record": value.record, "medal": value.medal, "maxcombo": value.maxcombo};
                      } else {
                        trackRecords[i][j] = {"rank": "rankQ", "record": 000000000, "medal": 0, "maxcombo": 0};
                      }
                    }
                  } else {
                    for(let j = 0; j < 3; j++) {
                      trackRecords[i][j] = {"rank": "rankQ", "record": 000000000, "medal": 0, "maxcombo": 0};
                    }
                  }
                }).catch((error) => {
                  alert(`Error occured.\n${error}`);
                  console.error(`Error occured.\n${error}`);
                });
              }
              Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
              selectSongContainer.innerHTML = songList;
            } else {
              alert('Failed to load song list.');
              console.error('Failed to load song list.');
            }
          }).catch((error) => {
            alert(`Error occured.\n${error}`);
            console.error(`Error occured.\n${error}`);
          });
        } else {
          alert(`Error occured.\n${data.description}`);
        }
      }).catch((error) => {
        alert(`Error occured.\n${error}`);
        console.error(`Error occured.\n${error}`);
      });
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
});

const songSelected = n => {
  if(!(songSelection == -1 && tracks[n].name == "URLATE Theme")) {
    songNameText.textContent = (settings.general.detailLang == 'original') ? tracks[n].original_name : tracks[n].name;
    songs[n].volume(1);
    if(songSelection != -1) {
      let i = songSelection;
      songs[i].fade(1, 0, 200);
      setTimeout(() => {
        songs[i].stop();
      }, 200);
    }
    if(themeSong.playing()) {
      themeSong.fade(1, 0, 500);
      setTimeout(() => {
        themeSong.stop();
      }, 500);
    }
    songs[n].play();
  }
  if(document.getElementsByClassName('songSelected')[0]) {
    document.getElementsByClassName('songSelected')[0].classList.remove('songSelected');
  }
  document.getElementsByClassName('songSelectionContainer')[n].classList.add('songSelected');
  selectTitle.textContent = (settings.general.detailLang == 'original') ? tracks[n].original_name : tracks[n].name;
  if(selectTitle.offsetWidth > window.innerWidth / 4) {
    selectTitle.style.fontSize = '4vh';
  } else {
    selectTitle.style.fontSize = '5vh';
  }
  selectArtist.textContent = tracks[n].producer;
  selectAlbum.src = `https://cdn.rhyga.me/albums/${settings.display.albumRes}/${tracks[n].fileName} (Custom).png`;
  selectBackground.style.backgroundImage = `url("https://cdn.rhyga.me/albums/${settings.display.albumRes}/${tracks[n].fileName} (Custom).png")`;
  let songSelectionContainer = document.getElementsByClassName('songSelectionContainer');
  let upperLimit = (songSelectionContainer[n < 2 ? 5 : n - 2].offsetHeight != 0 ? songSelectionContainer[n < 2 ? 5 : n - 2].offsetHeight : window.innerHeight / 12.5) * n;
  let containerHeight = selectSongContainer.offsetHeight != 0 ? selectSongContainer.offsetHeight : window.innerHeight / 1.39;
  let underLimit = upperLimit - containerHeight + (songSelectionContainer[n].offsetHeight != 0 ? songSelectionContainer[n].offsetHeight : window.innerHeight / 13);
  upperLimit = Math.round(upperLimit);
  underLimit = Math.round(underLimit);
  if(selectSongContainer.scrollTop > upperLimit) {
    selectSongContainer.scrollTop = upperLimit;
  } else if(selectSongContainer.scrollTop < underLimit) {
    setTimeout(() => {
      selectSongContainer.scrollTop = Math.round(underLimit + containerHeight / 50);
    }, songSelection == -1 ? 200 : 0);
  }
  if(songSelection != -1) {
    document.getElementsByClassName('ranks')[songSelection].className = "ranks";
    if(trackRecords[songSelection][2].rank != 'rankQ') {
      document.getElementsByClassName('ranks')[songSelection].classList.add(trackRecords[songSelection][2].rank);
    } else if(trackRecords[songSelection][1].rank != 'rankQ') {
      document.getElementsByClassName('ranks')[songSelection].classList.add(trackRecords[songSelection][1].rank);
    } else {
      document.getElementsByClassName('ranks')[songSelection].classList.add(trackRecords[songSelection][0].rank);
    }
  }
  fetch(`${api}/getTrackInfo/${tracks[n].name}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    console.log(data);
    data = data.info[0];
    difficulties = JSON.parse(tracks[n].difficulty);
    bulletDensities = JSON.parse(data.bullet_density);
    noteDensities = JSON.parse(data.note_density);
    speeds = JSON.parse(data.speed);
    bpm = data.bpm;
    updateDetails(n);
  });
  songSelection = n;
};

const numberWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const gameLoaded = () => {
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
  analyser = Howler.ctx.createAnalyser();
  Howler.masterGain.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  animationLooper();
};

Pace.on('done', () => {
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
  if(loaded) {
    gameLoaded();
  }
  loaded = 1;
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

const optionScreen = () => {
  display = 2;
  document.getElementById("optionContainer").style.display = "block";
  document.getElementById("optionContainer").classList.toggle("fadeIn");
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
    //OPTION
    fetch(`${api}/update/settings`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({
        settings: settings
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then((data) => {
      if(data.result != 'success') {
        alert(`Error occured.\n${data.error}`);
      }
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
    document.getElementById("optionContainer").classList.remove("fadeIn");
    document.getElementById("optionContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("optionContainer").classList.remove("fadeOut");
      document.getElementById("optionContainer").style.display = "none";
    }, 500);
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
  } else if(display == 5) {
    //Info Profile
    document.getElementById("infoProfileContainer").classList.remove("fadeIn");
    document.getElementById("infoProfileContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("infoProfileContainer").classList.remove("fadeOut");
      document.getElementById("infoProfileContainer").style.display = "none";
    }, 500);
    display = 4;
    return;
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
  if(songSelection == -1) {
    let min = Math.ceil(0);
    let max = Math.floor(tracks.length);
    songSelected(Math.floor(Math.random() * (max - min)) + min);
  }
  document.getElementById("selectContainer").style.display = "flex";
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
    window.location.href = `https://sandbox-secure.xsolla.com/paystation3/desktop/subscription/?access_token=${data.token}`;
  }).catch((error) => {
    advancedPurchasing.style.pointerEvents = "none";
    advancedPurchasing.style.opacity = "0";
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
};

const optionSelect = n => {
  document.getElementsByClassName('optionSelected')[0].classList.remove('optionSelected');
  document.getElementsByClassName('optionSelectors')[n].classList.add('optionSelected');
  document.getElementsByClassName('optionShow')[0].classList.remove('optionShow');
  document.getElementsByClassName('optionContentsContainer')[n].classList.add('optionShow');
};

const langChanged = e => {
  window.location.href = `${url}/${e.value}`;
};

const logout = e => {
  window.location.href = `${api}/logout?redirect=true`;
};

const settingChanged = (e, v) => {
  if(v == 'detailLang') {
    settings.general.detailLang = e.value;
  } else if(v == 'canvasRes') {
    settings.display.canvasRes = Number(e.value);
  } else if(v == 'albumRes') {
    settings.display.albumRes = Number(e.value);
  } else if(v == 'volumeMaster') {
    settings.sound.volume.master = e.value / 100;
    volumeMasterValue.textContent = e.value + '%';
    Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
  } else if(v == 'volumeSong') {
    settings.sound.volume.music = e.value / 100;
    volumeSongValue.textContent = e.value + '%';
    Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
  } else if(v == 'volumeHitsound') {
    settings.sound.volume.hitSound = e.value / 100;
    volumeHitValue.textContent = e.value + '%';
  } else if(v == 'volumeEffect') {
    settings.sound.volume.effect = e.value / 100;
    volumeEftValue.textContent = e.value + '%';
  } else if(v == 'soundRes') {
    settings.sound.res = e.value;
  } else if(v == 'sensitive') {
    settings.input.sens = e.value / 100;
    sensitiveValue.textContent = e.value / 100 + 'x';
  } else if(v == 'inputKey') {
    settings.input.keys = Number(e.value);
  } else if(v == 'inputMouse') {
    settings.input.mouse = e.checked;
  } else if(v == 'skin') {
    settings.game.skin = e.value;
  } else if(v == 'judgeSkin') {
    settings.game.judgeSkin = e.checked;
  } else if(v == 'inputSize') {
    settings.game.size = e.value / 10;
    inputSizeValue.textContent = e.value / 10 + 'x';
  } else if(v == 'Perfect' || v == 'Great' || v == 'Good' || v == 'Bad' || v == 'Miss' || v == 'Bullet') {
    settings.game.applyJudge[v] = e.checked;
  } else if(v == 'frameCounter') {
    settings.game.counter = e.checked;
  } else if(v == 'comboAlert') {
    settings.game.comboAlert = e.checked;
  } else if(v == 'comboCount') {
    settings.game.comboCount = parseInt(e.value);
  } else if(v == 'ignoreCursor') {
    settings.editor.denyCursor = e.checked;
  } else if(v == 'ignoreEditor') {
    settings.editor.denySkin = e.checked;
  } else if(v == 'ignoreTest') {
    settings.editor.denyAtTest = e.checked;
  }
};

const showProfile = name => {
  fetch(`${api}/getProfile/${name}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    let info = JSON.parse(data.data);
    infoProfileName.textContent = info[0].name;
    infoProfilePosition.textContent = info[0].position;
    infoProfileImg.src = `images/credits/${info[0].profile}`;
    let innerHTML = `<div class="infoProfilePart">
                          <img src="https://img.icons8.com/small/64/333333/comma.png" class="infoIcon">
                          <span id="quote">${info[0].quote}</span>
                     </div>`;
    for(let i = 1; i < info.length; i++) {
      let link = '';
      if(info[i].icon.indexOf("soundcloud") != -1) {
        link = `https://soundcloud.com/${info[i].content}`;
      } else if(info[i].icon.indexOf("youtube") != -1) {
        if(info[i].link != undefined) {
          link = info[i].link;
        }
      } else if(info[i].icon.indexOf("web") != -1) {
        link = `https://${info[i].content}`;
      } else if(info[i].icon.indexOf("github") != -1) {
        link = `https://github.com/${info[i].content}`;
      } else if(info[i].icon.indexOf("twitter") != -1) {
        link = `https://twitter.com/${info[i].content}`;
      } else if(info[i].icon.indexOf("telegram") != -1) {
        link = `https://t.me/${info[i].content}`;
      } else if(info[i].icon.indexOf("instagram") != -1) {
        link = `https://www.instagram.com/${info[i].content}`;
      } else if(info[i].icon.indexOf("email") != -1) {
        link = `mailto:${info[i].content}`;
      }
      innerHTML += `
                    <div class="infoProfilePart">
                        <img src="https://img.icons8.com/${info[i].icon.split('/')[0]}/64/333333/${info[i].icon.split('/')[1]}.png" class="infoIcon">
                        ${link == '' ? `<span>` : `<a class="blackLink" href="${link}" target="_blank">`}${info[i].content}${link == '' ? `</span>` : `</a>`}
                    </div>`;
    }
    infoProfileBottom.innerHTML = innerHTML;
    display = 5;
    document.getElementById("infoProfileContainer").style.display = "flex";
    document.getElementById("infoProfileContainer").classList.toggle("fadeIn");
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
};

const updateDetails = (n) => {
  bulletDensity.textContent = bulletDensities[difficultySelection];
  bulletDensityValue.style.width = `${bulletDensities[difficultySelection]}%`;
  noteDensity.textContent = noteDensities[difficultySelection];
  noteDensityValue.style.width = `${noteDensities[difficultySelection]}%`;
  bpmText.textContent = bpm;
  bpmValue.style.width = `${bpm / 3}%`;
  speed.textContent = speeds[difficultySelection];
  speedValue.style.width = `${speeds[difficultySelection] / 5 * 100}%`;
  let starText = '';
  for(let i = 0; i < difficulties[difficultySelection]; i++) {
    starText += '★'
  }
  for(let i = difficulties[difficultySelection]; i < 10; i++) {
    starText += '☆'
  }
  selectStars.textContent = starText;
  selectScoreValue.textContent = numberWithCommas(`${trackRecords[n][difficultySelection].record}`.padStart(9, '0'));
  document.getElementsByClassName('ranks')[n].className = "ranks";
  document.getElementsByClassName('ranks')[n].classList.add(trackRecords[n][difficultySelection].rank);
  let recordMedal = trackRecords[n][difficultySelection].medal;
  goldMedal.style.opacity = '0.1';
  silverMedal.style.opacity = '0.1';
  checkMedal.style.opacity = '0.1';
  if(recordMedal >= 4) {
    goldMedal.style.opacity = '1';
    recordMedal -= 4;
  }
  if(trackRecords >= 2) {
    silverMedal.style.opacity = '1';
    recordMedal -= 2;
  }
  if(trackRecords >= 1) {
    checkMedal.style.opacity = '1';
  }
};

const difficultySelected = n => {
  difficultySelection = n;
  document.getElementsByClassName('difficultySelected')[0].classList.remove('difficultySelected');
  document.getElementsByClassName('difficulty')[n].classList.add('difficultySelected');
  updateDetails(songSelection);
};

document.onkeydown = e => {
  e = e || window.event;
  let key = e.key.toLowerCase();
  //console.log(key);
  if(key == 'escape') {
    displayClose();
    return;
  }
  if(display == 0) {
    if(key == 'arrowleft') {
      e.preventDefault();
      menuLeft();
    } else if(key == 'arrowright') {
      e.preventDefault();
      menuRight();
    } else if(key == 'enter' || key == ' ') {
      e.preventDefault();
      menuSelected();
    }
  } else if(display == 1) {
    if(key == 'arrowup') {
      e.preventDefault();
      if(songSelection != 0) songSelected(songSelection - 1);
    } else if(key == 'arrowdown') {
      e.preventDefault();
      if(songSelection < tracks.length - 1) songSelected(songSelection + 1);
    } else if(key == 'tab') {
      e.preventDefault();
      difficultySelected(difficultySelection + 1 == 3 ? 0 : difficultySelection + 1);
    }
  }
};

window.addEventListener("resize", initialize);
