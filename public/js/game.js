let selection = 0;
let selectionList = ['menuMain', 'menuEditor', 'menuAdvanced', 'menuStore'];
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
let isRankOpened = false;
let isAdvanced = false;
let skins = [], DLCs = [];
let DLCdata = [];
let skinData = [];

let overlayTime = 0;
let shiftDown = false;

let offsetRate = 1;
let offset = 0;
let offsetInput = false;
let offsetPrevInput = false;
let offsetAverage = [];

let trackRecords = [];

let themeSong;
let songs = [];
let offsetSong = new Howl({
  src: [`${cdn}/tracks/offset.mp3`],
  format: ['mp3'],
  autoplay: false,
  loop: true
});

const initialize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

const convertWordArrayToUint8Array = wordArray => {
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
};

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
  for(let i = 0; i <= 1; i++) {
    volumeMaster[i].value = settings.sound.volume.master * 100;
    volumeMasterValue[i].textContent = settings.sound.volume.master * 100 + '%';
  }
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
  volumeSongValue.textContent = settings.sound.volume.music * 100 + '%';
  volumeHitValue.textContent = settings.sound.volume.hitSound * 100 + '%';
  volumeEftValue.textContent = settings.sound.volume.effect * 100 + '%';
  offsetButton.textContent = settings.sound.offset + 'ms';
  sensitiveValue.textContent = settings.input.sens + 'x';
  inputSizeValue.textContent = settings.game.size + 'x';
  offset = settings.sound.offset;
  if(offset != 0) {
    offsetButtonText.textContent = offset + 'ms';
  }
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
      if(display == 0 && songSelection == -1) {
        themeSong.play();
      }
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
  if(display == 0) {
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
  }
  requestAnimationFrame(animationLooper);
};

const sortAsName = (a, b) => {
  if(a.name == b.name) return 0;
  return a.name > b.name ? 1 : -1;
};

document.addEventListener("DOMContentLoaded", (event) => {
  fetch(`${api}/auth/getStatus`, {
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
          data = data.user;
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
            isAdvanced = true;
            document.getElementById('optionAdvanced').textContent = enabled;
            urlateText.innerHTML = '<strong>URLATE</strong> Advanced';
            registerBtn.value = registered;
            registerBtn.style.background = '#444';
            headerLeft.style.backgroundImage = `url('/images/parts/elements/namespace_advanced.png')`;
            let elements = document.getElementsByClassName('advancedOnly');
            for(let i = 0; i < elements.length; i++) {
              elements[i].style.display = 'flex';
            }
          }
          skins = JSON.parse(data.skins);
          DLCs = JSON.parse(data.DLCs);
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
                songList += `<div class="songSelectionContainer${tracks[i].type == 1 && !isAdvanced ? ' advancedSelection' : tracks[i].type == 2 ? ' dlcSelection' : ''}" onclick="songSelected(${i})">
                                <div class="songSelectionInfo">
                                    <span class="songSelectionTitle">${(settings.general.detailLang == 'original') ? tracks[i].originalName : tracks[i].name}</span>
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
                        if((tracks[i].type == 1 && !isAdvanced) || tracks[i].type == 2) {
                          trackRecords[i][j] = {"rank": "rankL", "record": 000000000, "medal": 0, "maxcombo": 0};
                        } else {
                          trackRecords[i][j] = {"rank": "rankQ", "record": 000000000, "medal": 0, "maxcombo": 0};
                        }
                      }
                    }
                  } else {
                    for(let j = 0; j < 3; j++) {
                      if((tracks[i].type == 1 && !isAdvanced) || tracks[i].type == 2) {
                        document.getElementsByClassName('ranks')[i].className = "ranks";
                        document.getElementsByClassName('ranks')[i].classList.add('rankL');
                        trackRecords[i][j] = {"rank": "rankL", "record": 000000000, "medal": 0, "maxcombo": 0};
                      } else {
                        trackRecords[i][j] = {"rank": "rankQ", "record": 000000000, "medal": 0, "maxcombo": 0};
                      }
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
  if(songSelection == n) {
    //play
    if((tracks[n].type == 1 && !isAdvanced) || tracks[n].type == 2) {
      alert('NOT ALLOWED TO PLAY'); //TODO
    } else {
      localStorage.difficultySelection = difficultySelection;
      localStorage.difficulty = JSON.parse(tracks[0].difficulty)[difficultySelection];
      localStorage.songName = tracks[songSelection].fileName;
      window.location.href = `${url}/play`;
    }
    return;
  }
  if(!(songSelection == -1 && tracks[n].name == "URLATE Theme")) {
    songNameText.textContent = (settings.general.detailLang == 'original') ? tracks[n].originalName : tracks[n].name;
    songs[n].volume(1);
    if(songSelection != -1) {
      let i = songSelection;
      songs[i].fade(1, 0, 200);
      setTimeout(() => {
        songs[i].stop();
      }, 200);
    }
    themeSong.fade(1, 0, 500);
    setTimeout(() => {
      themeSong.stop();
    }, 500);
    songs[n].play();
  }
  if(document.getElementsByClassName('songSelected')[0]) {
    document.getElementsByClassName('songSelected')[0].classList.remove('songSelected');
  }
  document.getElementsByClassName('songSelectionContainer')[n].classList.add('songSelected');
  selectTitle.textContent = (settings.general.detailLang == 'original') ? tracks[n].originalName : tracks[n].name;
  if(selectTitle.offsetWidth > window.innerWidth / 4) {
    selectTitle.style.fontSize = '4vh';
  } else {
    selectTitle.style.fontSize = '5vh';
  }
  selectArtist.textContent = tracks[n].producer;
  selectAlbum.src = `${cdn}/albums/${settings.display.albumRes}/${tracks[n].fileName} (Custom).png`;
  selectBackground.style.backgroundImage = `url("${cdn}/albums/${settings.display.albumRes}/${tracks[n].fileName} (Custom).png")`;
  setTimeout(() => {
    let underLimit = window.innerHeight * 0.08 * n + window.innerHeight * 0.09;
    underLimit = parseInt(underLimit);
    if(selectSongContainer.offsetHeight + selectSongContainer.scrollTop < underLimit) {
      selectSongContainer.scrollTop = underLimit - selectSongContainer.offsetHeight;
    } else if(underLimit - window.innerHeight * 0.09 < selectSongContainer.scrollTop) {
      selectSongContainer.scrollTop = selectSongContainer.scrollTop - (selectSongContainer.scrollTop - underLimit) - window.innerHeight * 0.09;
    }
  }, songSelection != -1 ? 0 : 200);
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
    data = data.info[0];
    difficulties = JSON.parse(tracks[n].difficulty);
    bulletDensities = JSON.parse(data.bullet_density);
    noteDensities = JSON.parse(data.note_density);
    speeds = JSON.parse(data.speed);
    bpm = data.bpm;
    updateDetails(n);
  });
  songSelection = n;
  updateRanks();
};

const updateRanks = () => {
  fetch(`${api}/getRecords/${tracks[songSelection].name}/${difficultySelection + 1}/record/DESC/${username}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then(data => {
    if(data.rank != 0) {
      selectRank.textContent = `#${data.rank}`;
    } else {
      selectRank.textContent = `-`;
    }
    data = data.results;
    let innerContent = '';
    for(let i = 0; i < data.length; i++) {
      innerContent += `<br>
                        <div class="selectRank">
                          <div class="selectRankNumber">${i + 1}</div>
                          <div class="selectRankName">${data[i].nickname}</div>
                          <div class="selectRankScore">${numberWithCommas(Number(data[i].record))}</div>
                      </div>`;
    }
    selectRankScoreContainer.innerHTML = innerContent;
  });
};

const numberWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const gameLoaded = () => {
  document.getElementById("menuContainer").style.display = "flex";
  document.getElementById("loadingContainer").classList.toggle("fadeOut");
  localStorage.clear('songName');
  localStorage.clear('difficulty');
  setTimeout(() => {
    document.getElementById("loadingContainer").style.display = "none";
    document.getElementById("menuContainer").classList.toggle("loaded");
    document.getElementById("urlateText").style.fontSize = "1.5vh";
    document.getElementById("urlateText").style.marginBottom = "0";
    document.getElementById("songName").style.fontSize = "3vh";
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
    fetch(`${api}/getUser`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then((data) => {
      data = data.user;
      if(!data.advanced) {
        if(settings.sound.res == "192kbps" ||
        !settings.game.judgeSkin ||
        JSON.stringify(settings.game.applyJudge) != `{"Perfect":false,"Great":false,"Good":false,"Bad":false,"Miss":false,"Bullet":false}`) {
          settings.sound.res = "128kbps";
          settings.game.judgeSkin = true;
          settings.game.applyJudge = {
            "Perfect": false,
            "Great": false,
            "Good": false,
            "Bad": false,
            "Miss": false,
            "Bullet": false
          };
        }
      }
    });
    settings.sound.offset = offset;
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
  } else if(display == 6) {
    //PLAY Rank
    document.getElementById("selectRankContainer").style.opacity = "0";
    document.getElementById("selectRankContainer").style.pointerEvents = "none";
    document.getElementById("selectRankInnerContainer").classList.remove("visible");
    display = 1;
    isRankOpened = false;
    return;
  } else if(display == 7) {
    //OPTION Offset
    offsetButton.textContent = offset + 'ms';
    document.getElementById("offsetContiner").classList.remove("fadeIn");
    document.getElementById("offsetContiner").classList.toggle("fadeOut");
    if(songSelection != -1) {
      songs[songSelection].play();
      songs[songSelection].fade(0, 1, 500);
    } else {
      themeSong.play();
      themeSong.fade(0, 1, 500);
    }
    offsetSong.fade(1, 0, 500);
    setTimeout(() => {
      document.getElementById("offsetContiner").classList.remove("fadeOut");
      document.getElementById("offsetContiner").style.display = "none";
      offsetSong.stop();
    }, 500);
    display = 2;
    return;
  } else if(display == 8) {
    //STORE
    document.getElementById("storeContainer").classList.remove("fadeIn");
    document.getElementById("storeContainer").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("storeContainer").classList.remove("fadeOut");
      document.getElementById("storeContainer").style.display = "none";
    }, 500);
  } else if(display == 9) {
    //DLC info
    document.getElementById("storeDLCInfo").classList.remove("fadeIn");
    document.getElementById("storeDLCInfo").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("storeDLCInfo").classList.remove("fadeOut");
      document.getElementById("storeDLCInfo").style.display = "none";
    }, 500);
    display = 8;
    return;
  } else if(display == 10) {
    //Skin info
    document.getElementById("storeSkinInfo").classList.remove("fadeIn");
    document.getElementById("storeSkinInfo").classList.toggle("fadeOut");
    setTimeout(() => {
      document.getElementById("storeSkinInfo").classList.remove("fadeOut");
      document.getElementById("storeSkinInfo").style.display = "none";
    }, 500);
    display = 8;
    return;
  }
  display = 0;
};

const showDLCinfo = n => {
  DLCinfoDLCName.textContent = document.getElementsByClassName('storeName')[n].textContent;
  DLCinfoArtistName.textContent = document.getElementsByClassName('storeSongArtist')[n].textContent;
  DLCInfoAlbum.src = document.getElementsByClassName('storeSongsAlbum')[n].src;
  if(DLCs.indexOf(DLCinfoDLCName.textContent) != -1) {
    DLCbasketButton.classList.add('storeButtonDisabled');
    DLCbasketButton.disabled = true;
    DLCbasketButton.textContent = purchased;
  } else {
    DLCbasketButton.classList.remove('storeButtonDisabled');
    DLCbasketButton.disabled = false;
    DLCbasketButton.textContent = addToBag;
  }
  DLCinfoSongsContainer.innerHTML = '';
  for(let i = 0; i < DLCdata[n].length; i++) {
    fetch(`${api}/getTrack/${DLCdata[n][i]}`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then((data) => {
      data = data.track[0];
      DLCinfoSongsContainer.innerHTML += `<div class="DLCinfoSongContainer">
                      <img src="${cdn}/albums/${settings.display.albumRes}/${data.fileName} (Custom).png" class="DLCinfoSongAlbum">
                      <div class="DLCinfoSongAbout">
                          <span class="DLCinfoSongName">${(settings.general.detailLang == 'original') ? data.originalName : data.name}</span>
                          <span class="DLCinfoSongProd">${data.producer}</span>
                      </div>
                  </div>`;
    }).catch((error) => {
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
  }
  document.getElementById("storeDLCInfo").style.display = "flex";
  document.getElementById("storeDLCInfo").classList.add("fadeIn");
  display = 9;
};

const showSkinInfo = n => {
  skinInfoSkinName.textContent = document.getElementsByClassName('storeSkinName')[n].textContent;
  skinInfoPreview.src = `${cdn}/skins/preview/${skinData[n]}.png`;
  if(skins.indexOf(skinInfoSkinName.textContent) != -1) {
    skinBasketButton.classList.add('storeButtonDisabled');
    skinBasketButton.disabled = true;
    skinBasketButton.textContent = purchased;
  } else {
    skinBasketButton.classList.remove('storeButtonDisabled');
    skinBasketButton.disabled = false;
    skinBasketButton.textContent = addToBag;
  }
  document.getElementById("storeSkinInfo").style.display = "flex";
  document.getElementById("storeSkinInfo").classList.add("fadeIn");
  display = 10;
};

const updateStore = () => {
  let langCode = 0;
  if(lang == 'ko') {
    langCode = 0;
  } else if(lang == 'ja') {
    langCode = 1;
  } else if(lang == 'en') {
    langCode = 2;
  }
  fetch(`${api}/store/getDLCs/${lang}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    DLCdata = [];
    data = data.data;
    document.getElementsByClassName('storeContentsContainer')[0].innerHTML = '';
    let elements = '';
    for(let i = 0; i < data.length / 2; i++) {
      elements += '<div class="storeRowContainer">';
      for(let j = 0; j < 2; j++) {
        if(data[i * 2 + j]) {
          DLCdata[i * 2 + j] = JSON.parse(data[i * 2 + j].songs);
          elements += `<div class="storeSongsContainer" onclick="showDLCinfo(${i * 2 + j})">
                        <div class="storeSongsLeft">
                          <img class="storeSongsAlbum" src="${cdn}/dlc/${data[i * 2 + j].previewFile}.png">
                        </div>
                        <div class="storeSongsRight">
                          <div class="storeSongsTop">
                            <span class="storeName">${data[i * 2 + j].name}</span>
                            <span class="storeSongArtist">${data[i * 2 + j].composer}</span>
                          </div>
                          <div class="storeSongsBottom">
                            <span class="storePrice">${DLCs.indexOf(data[i * 2 + j].name) != -1 ? purchased : numberWithCommas(JSON.parse(data[i * 2 + j].price)[langCode]) + currency}</span>
                          </div>
                        </div>
                      </div>`;
        } else {
          elements += `<div class="storeSongsContainer"></div>`;
        }
      }
      elements += '</div>';
    }
    document.getElementsByClassName('storeContentsContainer')[0].innerHTML = elements;
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
  fetch(`${api}/store/getSkins/${lang}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    skinData = [];
    data = data.data;
    document.getElementsByClassName('storeContentsContainer')[1].innerHTML = '';
    let elements = '';
    for(let i = 0; i < data.length / 2; i++) {
      elements += '<div class="storeRowContainer">';
      for(let j = 0; j < 2; j++) {
        if(data[i * 2 + j]) {
          skinData[i * 2 + j] = JSON.parse(data[i * 2 + j].previewFile);
          elements += `<div class="storeSkinsContainer" onclick="showSkinInfo(${i * 2 + j})">
                        <div class="storeSkinTitleContainer">
                          <span class="storeSkinName">${data[i * 2 + j].name}</span>
                        </div>
                        <div class="storeSkinContentContainer">
                          <img src="${cdn}/skins/${data[i * 2 + j].previewFile}.png" class="storeSkin">
                        </div>
                        <div class="storeSkinPriceContainer">
                          <span class="storePrice">${skins.indexOf(data[i * 2 + j].name) != -1 ? purchased : numberWithCommas(JSON.parse(data[i * 2 + j].price)[langCode]) + currency}</span>
                        </div>
                      </div>`;
        } else {
          elements += `<div class="storeSkinsContainer"></div>`;
        }
      }
      elements += '</div>';
    }
    document.getElementsByClassName('storeContentsContainer')[1].innerHTML = elements;
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
};

const menuSelected = () => {
  if(selection == 0) {
    //play
    display = 1;
    if(songSelection == -1) {
      let min = Math.ceil(0);
      let max = Math.floor(tracks.length);
      songSelected(Math.floor(Math.random() * (max - min)) + min);
    }
    document.getElementById("selectContainer").style.display = "flex";
    document.getElementById("selectContainer").classList.add("fadeIn");
  } else if(selection == 1) {
    //editor
    window.location.href = `${url}/editor`;
  } else if(selection == 2) {
    //advanced
    display = 3;
    document.getElementById("advancedContainer").style.display = "block";
    document.getElementById("advancedContainer").classList.add("fadeIn");
  } else if(selection == 3) {
    //store
    document.getElementById("storeContainer").style.display = "block";
    document.getElementById("storeContainer").classList.add("fadeIn");
    updateStore();
    display = 8;
  }
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

const storeSelect = n => {
  document.getElementsByClassName('storeSelected')[0].classList.remove('storeSelected');
  document.getElementsByClassName('storeSelectors')[n].classList.add('storeSelected');
  document.getElementsByClassName('storeShow')[0].classList.remove('storeShow');
  document.getElementsByClassName('storeContentsContainer')[n].classList.add('storeShow');
};

const langChanged = e => {
  window.location.href = `${url}/${e.value}`;
};

const logout = e => {
  window.location.href = `${api}/auth/logout?redirect=true`;
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
    for(let i = 0; i <= 1; i++) {
      volumeMasterValue[i].textContent = e.value + '%';
    }
    overlayTime = new Date().getTime();
    setTimeout(() => {
      overlayClose('volume');
    }, 1500);
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
  fetch(`${api}/getTeamProfile/${name}`, {
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
  if(recordMedal >= 2) {
    silverMedal.style.opacity = '1';
    recordMedal -= 2;
  }
  if(recordMedal >= 1) {
    checkMedal.style.opacity = '1';
  }
};

const difficultySelected = n => {
  difficultySelection = n;
  document.getElementsByClassName('difficultySelected')[0].classList.remove('difficultySelected');
  document.getElementsByClassName('difficulty')[n].classList.add('difficultySelected');
  updateDetails(songSelection);
  updateRanks();
};

const showRank = () => {
  isRankOpened = true;
  display = 6;
  document.getElementById("selectRankContainer").style.opacity = "1";
  document.getElementById("selectRankContainer").style.pointerEvents = "visible";
  document.getElementById("selectRankInnerContainer").classList.add("visible");
};

const offsetSetting = () => {
  display = 7;
  document.getElementById("offsetContiner").style.display = "flex";
  document.getElementById("offsetContiner").classList.toggle("fadeIn");
  if(songSelection != -1) {
    songs[songSelection].fade(1, 0, 500);
    setTimeout(() => {
      songs[songSelection].pause();
    }, 500);
  } else {
    themeSong.fade(1, 0, 500);
    setTimeout(() => {
      themeSong.pause();
    }, 500);
  }
  offsetSong.play();
  offsetSong.fade(0, 1, 500);
  offsetUpdate();
};

const offsetUpdate = () => {
  let beat = 60 / 110;
  let remain = (offsetSong.seek() % beat <= beat / 1.5 ? offsetSong.seek() % beat : (offsetSong.seek() % beat) - beat) * 1000 / offsetRate;
  let fillColor = '#373737';
  if(offsetSong.seek() <= beat + 0.005) fillColor = '#e56464';
  if(-50 <= remain && remain <= 0) {
    offsetNextCircle.style.backgroundColor = '#ffffff';
    offsetPrevCircle.style.backgroundColor = fillColor;
  } else if(0 <= remain && remain <= 50) {
    offsetPrevCircle.style.backgroundColor = '#ffffff';
    offsetTimingCircle.style.backgroundColor = fillColor;
  } else if(50 <= remain && remain <= 100) {
    offsetTimingCircle.style.backgroundColor = '#ffffff';
    offsetNextCircle.style.backgroundColor = fillColor;
  } else {
    offsetTimingCircle.style.backgroundColor = '#ffffff';
    offsetPrevCircle.style.backgroundColor = '#ffffff';
    offsetNextCircle.style.backgroundColor = '#ffffff';
  }
  if(offsetInput) {
    offsetInputCircle.style.backgroundColor = fillColor;
    if(!offsetPrevInput) {
      if(offsetAverage[offsetAverage.length - 1] - remain >= 50 || offsetAverage[offsetAverage.length - 1] + remain <= -50) {
        offsetAverage = [];
      }
      offsetAverage.push(parseInt(remain));
      let avr = 0;
      for(let i = offsetAverage.length - 1; i >= (offsetAverage.length - 10 < 0 ? 0 : offsetAverage.length - 10); i--) {
        avr += offsetAverage[i];
      }
      avr = avr / (offsetAverage.length >= 10 ? 10 : offsetAverage.length);
      offset = parseInt(avr);
      offsetButtonText.textContent = offset + 'ms';
    }
  } else {
    offsetInputCircle.style.backgroundColor = '#ffffff';
  }
  if(offset <= remain && remain <= offset + 50) {
    offsetOffsetCircle.style.backgroundColor = fillColor;
  } else {
    offsetOffsetCircle.style.backgroundColor = '#ffffff';
  }
  offsetPrevInput = offsetInput;
  if(display == 7) {
    window.requestAnimationFrame(offsetUpdate);
  } else {
    offsetAverage = [];
    offsetPrevInput = false;
    offsetInput = false;
  }
};

const offsetSpeedUp = () => {
  offsetRate = Number((offsetRate + 0.1).toFixed(1));
  if(offsetRate > 2) offsetRate = 2;
  offsetSong.rate(offsetRate);
  offsetSpeedText.textContent = offsetRate + 'x';
};

const offsetSpeedDown = () => {
  offsetRate = Number((offsetRate - 0.1).toFixed(1));
  if(offsetRate <= 0) offsetRate = 0.1;
  offsetSong.rate(offsetRate);
  offsetSpeedText.textContent = offsetRate + 'x';
};

const offsetUp = () => {
  offset += 5;
  if(!offset) {
    offsetButtonText.textContent = 'TAP';
  } else {
    offsetButtonText.textContent = offset + 'ms';
  }
};

const offsetDown = () => {
  offset -= 5;
  if(!offset) {
    offsetButtonText.textContent = 'TAP';
  } else {
    offsetButtonText.textContent = offset + 'ms';
  }
};

const offsetReset = () => {
  offset = 0;
  offsetButtonText.textContent = 'TAP';
  offsetAverage = [];
};

const offsetButtonDown = () => {
  offsetInput = true;
};

const offsetButtonUp = () => {
  offsetInput = false;
};

const overlayClose = s => {
  if(s == 'volume') {
    if(overlayTime + 1400 <= new Date().getTime()) {
      volumeOverlay.classList.remove('overlayOpen');
    }
  }
};

const scrollEvent = e => {
  if(shiftDown) {
    e = window.event || e;
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    if(delta == 1) { //UP
      if(settings.sound.volume.master <= 0.95) {
        settings.sound.volume.master = Math.round((settings.sound.volume.master + 0.05) * 100) / 100;
      } else {
        settings.sound.volume.master = 1;
      }
    } else { //DOWN
      if(settings.sound.volume.master >= 0.05) {
        settings.sound.volume.master = Math.round((settings.sound.volume.master - 0.05) * 100) / 100;
      } else {
        settings.sound.volume.master = 0;
      }
    }
    for(let i = 0; i <= 1; i++) {
      volumeMaster[i].value = Math.round(settings.sound.volume.master * 100);
      volumeMasterValue[i].textContent = `${Math.round(settings.sound.volume.master * 100)}%`;
    }
    Howler.volume(settings.sound.volume.master);
    volumeOverlay.classList.add('overlayOpen');
    overlayTime = new Date().getTime();
    setTimeout(() => {
      overlayClose('volume');
    }, 1500);
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
  }
};

document.onkeydown = e => {
  e = e || window.event;
  let key = e.key.toLowerCase();
  //console.log(key);
  if(key == 'escape') {
    displayClose();
    return;
  }
  if(key == 'shift') {
    shiftDown = true;
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
  } else if(display == 1 || display == 6) {
    if(key == 'arrowup') {
      e.preventDefault();
      if(songSelection != 0) songSelected(songSelection - 1);
    } else if(key == 'arrowdown') {
      e.preventDefault();
      if(songSelection < tracks.length - 1) songSelected(songSelection + 1);
    } else if(key == 'tab') {
      e.preventDefault();
      difficultySelected(difficultySelection + 1 == 3 ? 0 : difficultySelection + 1);
    } else if(key == 'enter') {
      e.preventDefault();
      songSelected(songSelection);
    } else if(key == 'f2') {
      e.preventDefault();
      if(isRankOpened) {
        displayClose();
      } else {
        showRank();
      }
    }
  } else if(display == 7) {
    offsetInput = true;
  }
};

document.onkeyup = e => {
  e = e || window.event;
  let key = e.key.toLowerCase();
  if(display == 7) {
    offsetInput = false;
  }
  if(key == 'shift') {
    shiftDown = false;
  }
};

window.addEventListener("resize", initialize);
window.addEventListener("mousewheel", scrollEvent);
window.addEventListener("DOMMouseScroll", scrollEvent);