const clientKey = "test_ck_7XZYkKL4Mrjb7EZwR6Lr0zJwlEWR";
const tossPayments = TossPayments(clientKey);

let display = -1;
let userid;
let username = "";
let analyser, dataArray;
let canvas = document.getElementById("renderer");
let ctx = canvas.getContext("2d");
let bars = 100;
let loaded = 0;
let paceLoaded = 0;
let songSelection = -1;
let difficultySelection = 0;
let difficulties = [1, 5, 10];
let bulletDensities = [10, 50, 100];
let noteDensities = [10, 50, 100];
let speeds = [1, 2, 3];
let bpm = 130;
let isRankOpened = false;
let isAdvanced = false;
let skins = [],
  DLCs = [];
let carts = new Set();
let cartArray = [];
let DLCdata = [];
let skinData = [];
let songData = [];
let loading = false;

let lottieAnim;

let intro1skipped = 0;
let intro1load = 0;

let intro2anim;
let intro2song;
let intro2skipped = 0;

let overlayTime = 0;
let shiftDown = false;

let offsetRate = 1;
let offset = 0;
let offsetInput = false;
let offsetPrevInput = false;
let offsetAverage = [];

let trackRecords = [];

let socket;

let themeSong;
let songs = [];
let offsetSong = new Howl({
  src: [`${cdn}/tracks/offset.mp3`],
  format: ["mp3"],
  autoplay: false,
  loop: true,
});

const lottieResize = () => {
  let widthWidth = window.innerWidth;
  let heightWidth = (window.innerHeight / 9) * 16;
  if (widthWidth > heightWidth) {
    animContainer.style.width = `${widthWidth}px`;
    animContainer.style.height = `${(widthWidth / 16) * 9}px`;
  } else {
    animContainer.style.width = `${heightWidth}px`;
    animContainer.style.height = `${(heightWidth / 16) * 9}px`;
  }
  let lottieCanvas = animContainer.getElementsByTagName("canvas")[0];
  widthWidth = window.innerWidth * window.devicePixelRatio;
  heightWidth = ((window.innerHeight * window.devicePixelRatio) / 9) * 16;
  if (lottieCanvas) {
    if (widthWidth > heightWidth) {
      lottieCanvas.width = widthWidth;
      lottieCanvas.height = (widthWidth / 16) * 9;
    } else {
      lottieCanvas.width = heightWidth;
      lottieCanvas.height = (heightWidth / 16) * 9;
    }
  }
  lottieAnim.destroy();
  lottieAnim = bodymovin.loadAnimation({
    wrapper: animContainer,
    animType: "canvas",
    loop: true,
    path: "lottie/game.json",
  });
};

const socketInitialize = () => {
  socket = io("https://game.rhyga.me", { query: `id=${userid}` });

  socket.on("connect", () => {
    socket.on("chat message", (msg) => {
      console.log(msg);
    });
  });
};

const initialize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  lottieResize();
};

const convertWordArrayToUint8Array = (wordArray) => {
  let arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
  let length = wordArray.hasOwnProperty("sigBytes")
    ? wordArray.sigBytes
    : arrayOfWords.length * 4;
  let uInt8Array = new Uint8Array(length),
    index = 0,
    word,
    i;
  for (i = 0; i < length; i++) {
    word = arrayOfWords[i];
    uInt8Array[index++] = word >> 24;
    uInt8Array[index++] = (word >> 16) & 0xff;
    uInt8Array[index++] = (word >> 8) & 0xff;
    uInt8Array[index++] = word & 0xff;
  }
  return uInt8Array;
};

const settingApply = () => {
  if (settings.general.detailLang == "original") {
    langDetailSelector.getElementsByTagName("option")[0].selected = true;
  } else if (settings.general.detailLang == "english") {
    langDetailSelector.getElementsByTagName("option")[1].selected = true;
  }
  if (settings.display.canvasRes == 100) {
    canvasResSelector.getElementsByTagName("option")[0].selected = true;
  } else if (settings.display.canvasRes == 75) {
    canvasResSelector.getElementsByTagName("option")[1].selected = true;
  } else if (settings.display.canvasRes == 50) {
    canvasResSelector.getElementsByTagName("option")[2].selected = true;
  } else if (settings.display.canvasRes == 25) {
    canvasResSelector.getElementsByTagName("option")[3].selected = true;
  }
  if (settings.display.albumRes == 100) {
    albumResSelector.getElementsByTagName("option")[0].selected = true;
  } else if (settings.display.albumRes == 75) {
    albumResSelector.getElementsByTagName("option")[1].selected = true;
  } else if (settings.display.albumRes == 50) {
    albumResSelector.getElementsByTagName("option")[2].selected = true;
  }
  if (settings.sound.res == "96kbps") {
    soundResSelector.getElementsByTagName("option")[0].selected = true;
  } else if (settings.sound.res == "128kbps") {
    soundResSelector.getElementsByTagName("option")[1].selected = true;
  } else if (settings.sound.res == "192kbps") {
    soundResSelector.getElementsByTagName("option")[2].selected = true;
  }
  if (settings.game.comboCount == 10) {
    comboSelector.getElementsByTagName("option")[0].selected = true;
  } else if (settings.game.comboCount == 25) {
    comboSelector.getElementsByTagName("option")[1].selected = true;
  } else if (settings.game.comboCount == 50) {
    comboSelector.getElementsByTagName("option")[2].selected = true;
  } else if (settings.game.comboCount == 100) {
    comboSelector.getElementsByTagName("option")[3].selected = true;
  } else if (settings.game.comboCount == 200) {
    comboSelector.getElementsByTagName("option")[4].selected = true;
  }
  for (let i = 0; i < skinSelector.getElementsByTagName("option").length; i++) {
    if (
      skinSelector.getElementsByTagName("option")[i].value == settings.game.skin
    ) {
      skinSelector.getElementsByTagName("option")[i].selected = true;
      break;
    }
  }
  inputSelector.getElementsByTagName("option")[
    Number(settings.input.keys)
  ].selected = true;
  for (let i = 0; i <= 1; i++) {
    volumeMaster[i].value = settings.sound.volume.master * 100;
    volumeMasterValue[i].textContent = settings.sound.volume.master * 100 + "%";
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
  volumeSongValue.textContent = settings.sound.volume.music * 100 + "%";
  volumeHitValue.textContent = settings.sound.volume.hitSound * 100 + "%";
  volumeEftValue.textContent = settings.sound.volume.effect * 100 + "%";
  offsetButton.textContent = settings.sound.offset + "ms";
  sensitiveValue.textContent = settings.input.sens + "x";
  inputSizeValue.textContent = settings.game.size + "x";
  offset = settings.sound.offset;
  if (offset != 0) {
    offsetButtonText.textContent = offset + "ms";
  }
  initialize();
  themeSong = new Howl({
    src: [`${cdn}/tracks/${settings.sound.res}/urlate_theme.mp3`],
    format: ["mp3"],
    autoplay: false,
    loop: true,
    onload: () => {
      loaded++;
      if (loaded == 3) {
        loaded = -1;
        gameLoaded();
      }
      Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
      intro1video.volume =
        settings.sound.volume.master * settings.sound.volume.music;
    },
  });
};

const drawBar = (x1, y1, x2, y2, width) => {
  lineColor = "rgb(0, 0, 0)";
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const animationLooper = () => {
  if (display == 0) {
    let width = canvas.width;
    let height = canvas.height;
    let wWidth = window.innerWidth;
    let wHeight = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    let barWidth = wHeight / bars;
    analyser.getByteFrequencyData(dataArray);
    for (let i = 0; i < bars; i++) {
      let barHeight = (dataArray[i] * wHeight) / 550;
      let y = barWidth * i;
      let x_end = barHeight / 1.3;
      drawBar(0, y, x_end, y, barWidth - barWidth / 2);
      y = wHeight - y;
      drawBar(wWidth, y, wWidth - x_end, y, barWidth - barWidth / 2);
    }
  }
  requestAnimationFrame(animationLooper);
};

const sortAsName = (a, b) => {
  if (a.name == b.name) return 0;
  return a.name > b.name ? 1 : -1;
};

const warningSkip = () => {
  if (display == -1) {
    warningContainer.style.opacity = "0";
    intro1video.play();
    setTimeout(() => {
      warningContainer.style.display = "none";
    }, 500);
    display = 0;
  }
};

const intro1loaded = () => {
  if (intro1load == 1) {
    document.getElementById("pressAnywhere").textContent = pressAnywhere;
    document.getElementById("warningContainer").onclick = warningSkip;
  }
  intro1load++;
};

const intro1skip = () => {
  intro1video.pause();
  if (!intro1skipped) {
    intro1skipped++;
    intro1container.style.opacity = "0";
    setTimeout(() => {
      intro1container.style.display = "none";
      intro2anim.setSpeed(1);
      intro2play();
    }, 500);
  }
};

intro1video.onended = () => {
  intro1skip();
};

const intro2skip = () => {
  if (!intro2skipped) {
    intro2skipped++;
    intro2anim.setVolume(0);
    intro2anim.stop();
    intro2container.style.opacity = "0";
    setTimeout(() => {
      loaded++;
      setTimeout(() => {
        if (loaded == 3) {
          loaded = -1;
          gameLoaded();
        }
      }, 1000);
      intro2container.style.display = "none";
    }, 500);
  }
};

const intro2animUpdate = () => {
  if (intro2anim.currentFrame >= 95) {
    intro2container.style.transitionDuration = "0s";
    requestAnimationFrame(() => {
      intro2container.style.backgroundColor = "#fff";
      requestAnimationFrame(() => {
        intro2container.style.transitionDuration = "0.5s";
      });
    });
  } else {
    requestAnimationFrame(intro2animUpdate);
  }
};

const intro2play = () => {
  intro2anim.play();
  intro2animUpdate();
  setTimeout(() => {
    intro2skip();
  }, 5000);
};

document.addEventListener("DOMContentLoaded", (event) => {
  const iniMode = new URLSearchParams(window.location.search).get("initialize");
  history.pushState("someAwesomeState", null, null);
  let widthWidth = window.innerWidth;
  let heightWidth = (window.innerHeight / 9) * 16;
  if (widthWidth > heightWidth) {
    animContainer.style.width = `${widthWidth}px`;
    animContainer.style.height = `${(widthWidth / 16) * 9}px`;
  } else {
    animContainer.style.width = `${heightWidth}px`;
    animContainer.style.height = `${(heightWidth / 16) * 9}px`;
  }
  setTimeout(() => {
    warningInner.style.opacity = "1";
  }, 1000);
  setTimeout(() => {
    if (intro1load == 1) {
      document.getElementById("pressAnywhere").textContent = pressAnywhere;
      document.getElementById("warningContainer").onclick = warningSkip;
    }
    intro1load++;
    document.getElementById("pressAnywhere").style.opacity = "1";
    warningInner.style.borderBottom = "0.1vh solid #555";
  }, 3000);
  if (iniMode == 0) {
    //no intro
    warningContainer.style.display = "none";
    intro1container.style.display = "none";
    intro2container.style.display = "none";
    loaded++;
    display = 0;
  } else {
    if (intro1video.canPlayType("video/webm")) {
      intro1sources.src = "videos/croissant.webm";
    } else {
      intro1sources.type = "video/mp4";
      intro1sources.src = "videos/croissant.mp4";
    }
    intro1video.load();

    intro2anim = bodymovin.loadAnimation({
      wrapper: intro2,
      animType: "canvas",
      autoplay: false,
      loop: false,
      path: "lottie/coupy.json",
    });

    setTimeout(intro1loaded, 10000);
  }

  lottieAnim = bodymovin.loadAnimation({
    wrapper: animContainer,
    animType: "canvas",
    loop: true,
    path: "lottie/game.json",
  });
  lottieAnim.addEventListener("DOMLoaded", () => {
    lottieResize();
  });
  lottie.setSpeed(0.5);
  fetch(`${api}/auth/status`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status == "Not authorized") {
        window.location.href = `${url}/authorize`;
      } else if (data.status == "Not registered") {
        window.location.href = `${url}/join`;
      } else if (data.status == "Not logined") {
        window.location.href = url;
      } else {
        fetch(`${api}/user`, {
          method: "GET",
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.result == "success") {
              data = data.user;
              settings = JSON.parse(data.settings);
              username = data.nickname;
              userid = data.userid;
              socketInitialize();
              document.getElementById("name").textContent = username;
              document.getElementById("optionName").textContent = username;
              if (lang == "ko") {
                langSelector.getElementsByTagName("option")[0].selected = true;
              } else if (lang == "en") {
                langSelector.getElementsByTagName("option")[1].selected = true;
              }
              if (data.advanced) {
                isAdvanced = true;
                document.getElementById("optionAdvanced").textContent = enabled;
                urlateText.innerHTML = "<strong>URLATE</strong> Advanced";
                registerBtn.value = registered;
                registerBtn.style.background = "#444";
                registerBtn.disabled = true;
                registerBtn.classList.remove("clickable");
                headerLeft.style.backgroundImage = `url('/images/parts/elements/namespace_advanced.png')`;
                let elements = document.getElementsByClassName("advancedOnly");
                for (let i = 0; i < elements.length; i++) {
                  elements[i].style.display = "flex";
                }
              }
              skins = JSON.parse(data.skins);
              DLCs = JSON.parse(data.DLCs);
              for (let i = 0; i < skins.length; i++) {
                let option = document.createElement("option");
                option.appendChild(document.createTextNode(skins[i]));
                skinSelector.appendChild(option);
              }
              for (let i = 0; i < DLCs.length; i++) {
                fetch(`${api}/store/DLC/${DLCs[i]}`, {
                  method: "GET",
                  credentials: "include",
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.result == "success") {
                      data = data.data;
                      data.songs = JSON.parse(data.songs);
                      for (let j = 0; j < data.songs.length; j++) {
                        songData.push(data.songs[j]);
                      }
                    } else {
                      alert("Failed to load DLC list.");
                      console.error("Failed to load DLC list.");
                    }
                  })
                  .catch((error) => {
                    alert(`Error occured.\n${error}`);
                    console.error(`Error occured.\n${error}`);
                  });
              }
              settingApply();
              fetch(`${api}/tracks`, {
                method: "GET",
                credentials: "include",
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.result == "success") {
                    tracks = data.tracks;
                    tracks.sort(sortAsName);
                    let songList = "";
                    for (let i = 0; i < tracks.length; i++) {
                      songs[i] = new Howl({
                        src: [
                          `https://cdn.rhyga.me/tracks/preview/${tracks[i].fileName}.mp3`,
                        ],
                        format: ["mp3"],
                        autoplay: false,
                        loop: true,
                      });
                      songList += `<div class="songSelectionContainer${
                        tracks[i].type == 1 && !isAdvanced
                          ? " advancedSelection"
                          : tracks[i].type == 2
                          ? " dlcSelection"
                          : ""
                      }" onclick="songSelected(${i})">
                                <div class="songSelectionInfo">
                                    <span class="songSelectionTitle">${
                                      settings.general.detailLang == "original"
                                        ? tracks[i].originalName
                                        : tracks[i].name
                                    }</span>
                                    <span class="songSelectionArtist">${
                                      tracks[i].producer
                                    }</span>
                                </div>
                                <div class="songSelectionRank">
                                    <span class="ranks rankQ"></span>
                                </div>
                            </div>`;
                      fetch(`${api}/record/${tracks[i].name}/${username}`, {
                        method: "GET",
                        credentials: "include",
                      })
                        .then((res) => res.json())
                        .then((data) => {
                          trackRecords[i] = [];
                          if (data.result == "success") {
                            for (let j = 0; j < 3; j++) {
                              if (
                                (tracks[i].type == 1 && !isAdvanced) ||
                                (tracks[i].type == 2 &&
                                  !(songData.indexOf(tracks[i].name) != -1))
                              ) {
                                trackRecords[i][j] = {
                                  rank: "rankL",
                                  record: 000000000,
                                  medal: 0,
                                  maxcombo: 0,
                                };
                              } else {
                                trackRecords[i][j] = {
                                  rank: "rankQ",
                                  record: 000000000,
                                  medal: 0,
                                  maxcombo: 0,
                                };
                              }
                            }
                            for (let j = 0; j < 3; j++) {
                              if (data.results[j] != undefined) {
                                let value = data.results[j];
                                trackRecords[i][value.difficulty - 1] = {
                                  rank: `rank${value.rank}`,
                                  record: value.record,
                                  medal: value.medal,
                                  maxcombo: value.maxcombo,
                                };
                              }
                            }
                          } else {
                            for (let j = 0; j < 3; j++) {
                              if (
                                (tracks[i].type == 1 && !isAdvanced) ||
                                (tracks[i].type == 2 &&
                                  !(songData.indexOf(tracks[i].name) != -1))
                              ) {
                                document.getElementsByClassName("ranks")[
                                  i
                                ].className = "ranks";
                                document
                                  .getElementsByClassName("ranks")
                                  [i].classList.add("rankL");
                                trackRecords[i][j] = {
                                  rank: "rankL",
                                  record: 000000000,
                                  medal: 0,
                                  maxcombo: 0,
                                };
                              } else {
                                trackRecords[i][j] = {
                                  rank: "rankQ",
                                  record: 000000000,
                                  medal: 0,
                                  maxcombo: 0,
                                };
                              }
                            }
                          }
                        })
                        .catch((error) => {
                          alert(`Error occured.\n${error}`);
                          console.error(`Error occured.\n${error}`);
                        });
                    }
                    Howler.volume(
                      settings.sound.volume.master * settings.sound.volume.music
                    );
                    intro1video.volume =
                      settings.sound.volume.master *
                      settings.sound.volume.music;
                    selectSongContainer.innerHTML = songList;
                  } else {
                    alert("Failed to load song list.");
                    console.error("Failed to load song list.");
                  }
                })
                .catch((error) => {
                  alert(`Error occured.\n${error}`);
                  console.error(`Error occured.\n${error}`);
                });
            } else {
              alert(`Error occured.\n${data.description}`);
            }
          })
          .catch((error) => {
            alert(`Error occured.\n${error}`);
            console.error(`Error occured.\n${error}`);
          });
      }
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
});

const songSelected = (n) => {
  loadingShow();
  if (songSelection == n) {
    //play
    if (
      (tracks[n].type == 1 && !isAdvanced) ||
      (tracks[n].type == 2 && !(songData.indexOf(tracks[n].name) != -1))
    ) {
      alert("NOT ALLOWED TO PLAY"); //TODO
    } else {
      localStorage.difficultySelection = difficultySelection;
      localStorage.difficulty = JSON.parse(tracks[0].difficulty)[
        difficultySelection
      ];
      localStorage.songName = tracks[songSelection].fileName;
      window.location.href = `${url}/play`;
    }
    return;
  }
  if (!(songSelection == -1 && tracks[n].name == "URLATE Theme")) {
    songNameText.textContent =
      settings.general.detailLang == "original"
        ? tracks[n].originalName
        : tracks[n].name;
    songs[n].volume(1);
    if (songSelection != -1) {
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
  if (document.getElementsByClassName("songSelected")[0]) {
    document
      .getElementsByClassName("songSelected")[0]
      .classList.remove("songSelected");
  }
  document
    .getElementsByClassName("songSelectionContainer")
    [n].classList.add("songSelected");
  selectTitle.textContent =
    settings.general.detailLang == "original"
      ? tracks[n].originalName
      : tracks[n].name;
  if (selectTitle.offsetWidth > window.innerWidth / 4) {
    selectTitle.style.fontSize = "4vh";
  } else {
    selectTitle.style.fontSize = "5vh";
  }
  selectArtist.textContent = tracks[n].producer;
  selectAlbum.src = `${cdn}/albums/${settings.display.albumRes}/${tracks[n].fileName} (Custom).png`;
  selectBackground.style.backgroundImage = `url("${cdn}/albums/${settings.display.albumRes}/${tracks[n].fileName} (Custom).png")`;
  setTimeout(
    () => {
      let underLimit =
        window.innerHeight * 0.08 * n + window.innerHeight * 0.09;
      underLimit = parseInt(underLimit);
      if (
        selectSongContainer.offsetHeight + selectSongContainer.scrollTop <
        underLimit
      ) {
        selectSongContainer.scrollTop =
          underLimit - selectSongContainer.offsetHeight;
      } else if (
        underLimit - window.innerHeight * 0.09 <
        selectSongContainer.scrollTop
      ) {
        selectSongContainer.scrollTop =
          selectSongContainer.scrollTop -
          (selectSongContainer.scrollTop - underLimit) -
          window.innerHeight * 0.09;
      }
    },
    songSelection != -1 ? 0 : 200
  );
  if (songSelection != -1) {
    document.getElementsByClassName("ranks")[songSelection].className = "ranks";
    if (trackRecords[songSelection][2].rank != "rankQ") {
      document
        .getElementsByClassName("ranks")
        [songSelection].classList.add(trackRecords[songSelection][2].rank);
    } else if (trackRecords[songSelection][1].rank != "rankQ") {
      document
        .getElementsByClassName("ranks")
        [songSelection].classList.add(trackRecords[songSelection][1].rank);
    } else {
      document
        .getElementsByClassName("ranks")
        [songSelection].classList.add(trackRecords[songSelection][0].rank);
    }
  }
  fetch(`${api}/trackInfo/${tracks[n].name}`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
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
  fetch(
    `${api}/records/${tracks[songSelection].name}/${
      difficultySelection + 1
    }/record/DESC/${username}`,
    {
      method: "GET",
      credentials: "include",
    }
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.rank != 0) {
        selectRank.textContent = `#${data.rank}`;
      } else {
        selectRank.textContent = `-`;
      }
      data = data.results;
      let innerContent = "";
      for (let i = 0; i < data.length; i++) {
        innerContent += `<br>
                        <div class="selectRank">
                          <div class="selectRankNumber">${i + 1}</div>
                          <div class="selectRankName">${data[i].nickname}</div>
                          <div class="selectRankScore">${numberWithCommas(
                            Number(data[i].record)
                          )}</div>
                      </div>`;
      }
      loadingHide();
      selectRankScoreContainer.innerHTML = innerContent;
    });
};

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const gameLoaded = () => {
  if (display == 0 && songSelection == -1) {
    themeSong.play();
  }
  document.getElementById("menuContainer").style.display = "flex";
  document.getElementById("loadingContainer").classList.add("fadeOut");
  localStorage.clear("songName");
  localStorage.clear("difficulty");
  setTimeout(() => {
    document.getElementById("loadingContainer").style.display = "none";
    document.getElementById("menuContainer").classList.add("loaded");
    document.getElementById("urlateText").style.fontSize = "1.5vh";
    document.getElementById("urlateText").style.marginBottom = "0";
    document.getElementById("songName").style.fontSize = "3vh";
    document.getElementById("header").classList.add("fadeIn");
    setTimeout(() => {
      let backIcons = document.getElementsByClassName("backIcon");
      for (let i = 0; i < backIcons.length; i++) {
        backIcons[i].classList.add("show");
      }
      document.getElementById("songName").classList.add("fadeIn");
    });
    document.getElementById("footerLeft").classList.add("fadeIn");
  }, 500);
  analyser = Howler.ctx.createAnalyser();
  Howler.masterGain.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  animationLooper();
};

Pace.on("done", () => {
  const nameStyle = window.getComputedStyle(
    document.getElementById("name"),
    null
  );
  const nameWidth = parseFloat(nameStyle.getPropertyValue("width"));
  if (nameWidth > 265) {
    document.getElementById("name").style.fontSize = "2.2vh";
    document.getElementById("name").style.paddingLeft = "2.5vw";
  } else if (nameWidth > 200) {
    document.getElementById("name").style.fontSize = "2.3vh";
    document.getElementById("name").style.paddingLeft = "4vw";
  } else if (nameWidth > 180) {
    document.getElementById("name").style.fontSize = "2.5vh";
  }
  if (!paceLoaded) {
    loaded++;
    paceLoaded++;
  }
  if (loaded == 3) {
    loaded = -1;
    gameLoaded();
  }
});

const infoScreen = () => {
  display = 4;
  document.getElementById("infoContainer").style.display = "block";
  document.getElementById("infoContainer").classList.add("fadeIn");
};

const optionScreen = () => {
  display = 2;
  document.getElementById("optionContainer").style.display = "block";
  document.getElementById("optionContainer").classList.add("fadeIn");
};

const displayClose = () => {
  if (!loading) {
    if (display == 1) {
      //PLAY
      document.getElementById("selectContainer").classList.remove("fadeIn");
      document.getElementById("selectContainer").classList.add("fadeOut");
      setTimeout(() => {
        document.getElementById("selectContainer").classList.remove("fadeOut");
        document.getElementById("selectContainer").style.display = "none";
      }, 500);
    } else if (display == 2) {
      //OPTION
      loadingShow();
      fetch(`${api}/user`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          data = data.user;
          if (!data.advanced) {
            if (
              settings.sound.res == "192kbps" ||
              !settings.game.judgeSkin ||
              JSON.stringify(settings.game.applyJudge) !=
                `{"Perfect":false,"Great":false,"Good":false,"Bad":false,"Miss":false,"Bullet":false}`
            ) {
              settings.sound.res = "128kbps";
              settings.game.judgeSkin = true;
              settings.game.applyJudge = {
                Perfect: false,
                Great: false,
                Good: false,
                Bad: false,
                Miss: false,
                Bullet: false,
              };
            }
          }
        });
      settings.sound.offset = offset;
      fetch(`${api}/settings`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          settings: settings,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result != "success") {
            alert(`Error occured.\n${data.error}`);
          }
          loadingHide();
        })
        .catch((error) => {
          alert(`Error occured.\n${error}`);
          console.error(`Error occured.\n${error}`);
        });
      document.getElementById("optionContainer").classList.remove("fadeIn");
      document.getElementById("optionContainer").classList.add("fadeOut");
      setTimeout(() => {
        document.getElementById("optionContainer").classList.remove("fadeOut");
        document.getElementById("optionContainer").style.display = "none";
      }, 500);
    } else if (display == 3) {
      //ADVANCED
      document.getElementById("advancedContainer").classList.remove("fadeIn");
      document.getElementById("advancedContainer").classList.add("fadeOut");
      setTimeout(() => {
        document
          .getElementById("advancedContainer")
          .classList.remove("fadeOut");
        document.getElementById("advancedContainer").style.display = "none";
      }, 500);
    } else if (display == 4) {
      //Info
      document.getElementById("infoContainer").classList.remove("fadeIn");
      document.getElementById("infoContainer").classList.add("fadeOut");
      setTimeout(() => {
        document.getElementById("infoContainer").classList.remove("fadeOut");
        document.getElementById("infoContainer").style.display = "none";
      }, 500);
    } else if (display == 5) {
      //Info Profile
      document
        .getElementById("infoProfileContainer")
        .classList.remove("fadeIn");
      document.getElementById("infoProfileContainer").classList.add("fadeOut");
      setTimeout(() => {
        document
          .getElementById("infoProfileContainer")
          .classList.remove("fadeOut");
        document.getElementById("infoProfileContainer").style.display = "none";
      }, 500);
      display = 4;
      return;
    } else if (display == 6) {
      //PLAY Rank
      document.getElementById("selectRankContainer").style.opacity = "0";
      document.getElementById("selectRankContainer").style.pointerEvents =
        "none";
      document
        .getElementById("selectRankInnerContainer")
        .classList.remove("visible");
      display = 1;
      isRankOpened = false;
      return;
    } else if (display == 7) {
      //OPTION Offset
      offsetButton.textContent = offset + "ms";
      document.getElementById("offsetContiner").classList.remove("fadeIn");
      document.getElementById("offsetContiner").classList.add("fadeOut");
      if (songSelection != -1) {
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
    } else if (display == 8) {
      //STORE
      document.getElementById("storeContainer").classList.remove("fadeIn");
      document.getElementById("storeContainer").classList.add("fadeOut");
      setTimeout(() => {
        document.getElementById("storeContainer").classList.remove("fadeOut");
        document.getElementById("storeContainer").style.display = "none";
      }, 500);
    } else if (display == 9) {
      //DLC info
      document.getElementById("storeDLCInfo").classList.remove("fadeIn");
      document.getElementById("storeDLCInfo").classList.add("fadeOut");
      setTimeout(() => {
        document.getElementById("storeDLCInfo").classList.remove("fadeOut");
        document.getElementById("storeDLCInfo").style.display = "none";
      }, 500);
      display = 8;
      return;
    } else if (display == 10) {
      //Skin info
      document.getElementById("storeSkinInfo").classList.remove("fadeIn");
      document.getElementById("storeSkinInfo").classList.add("fadeOut");
      setTimeout(() => {
        document.getElementById("storeSkinInfo").classList.remove("fadeOut");
        document.getElementById("storeSkinInfo").style.display = "none";
      }, 500);
      display = 8;
      return;
    } else if (display == 11) {
      //Store purchase method selection
      overlayPaymentContainer.style.pointerEvents = "none";
      overlayPaymentContainer.style.opacity = "0";
      overlayCodeContainer;
      display = 8;
      return;
    } else if (display == 12) {
      //Coupon code form
      overlayCodeContainer.style.pointerEvents = "none";
      overlayCodeContainer.style.opacity = "0";
      display = 2;
      return;
    }
    display = 0;
  }
};

const loadingOverlayShow = () => {
  loading = true;
  overlayLoadingContainer.style.pointerEvents = "all";
  overlayLoadingContainer.style.opacity = "1";
};

const loadingOverlayHide = () => {
  loading = false;
  overlayLoadingContainer.style.pointerEvents = "none";
  overlayLoadingContainer.style.opacity = "0";
};

const loadingShow = () => {
  loadingCircle.style.pointerEvents = "all";
  loadingCircle.style.opacity = "1";
};

const loadingHide = () => {
  loadingCircle.style.pointerEvents = "none";
  loadingCircle.style.opacity = "0";
};

const showDLCinfo = async (n) => {
  loadingOverlayShow();
  DLCInfoDLCName.textContent = document.getElementsByClassName("storeName")[
    n
  ].textContent;
  DLCinfoArtistName.textContent = document.getElementsByClassName(
    "storeSongArtist"
  )[n].textContent;
  DLCInfoAlbum.src = document.getElementsByClassName("storeSongsAlbum")[n].src;
  if (DLCs.indexOf(DLCInfoDLCName.textContent) != -1) {
    DLCbasketButton.classList.add("storeButtonDisabled");
    DLCbasketButton.disabled = true;
    DLCbasketButton.textContent = purchased;
  } else if (carts.has(DLCInfoDLCName.textContent)) {
    DLCbasketButton.classList.add("storeButtonDisabled");
    DLCbasketButton.disabled = true;
    DLCbasketButton.textContent = addedToBag;
  } else {
    DLCbasketButton.classList.remove("storeButtonDisabled");
    DLCbasketButton.disabled = false;
    DLCbasketButton.textContent = addToBag;
  }
  let elements = "";
  for (let i = 0; i < DLCdata[n].length; i++) {
    await fetch(`${api}/track/${DLCdata[n][i]}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        data = data.track[0];
        elements += `<div class="DLCinfoSongContainer">
                      <img src="${cdn}/albums/50/${
          data.fileName
        } (Custom).png" class="DLCinfoSongAlbum">
                      <div class="DLCinfoSongAbout">
                          <span class="DLCinfoSongName">${
                            settings.general.detailLang == "original"
                              ? data.originalName
                              : data.name
                          }</span>
                          <span class="DLCinfoSongProd">${data.producer}</span>
                      </div>
                  </div>`;
      })
      .catch((error) => {
        alert(`Error occured.\n${error}`);
        console.error(`Error occured.\n${error}`);
      });
  }
  DLCinfoSongsContainer.innerHTML = elements;
  document.getElementById("storeDLCInfo").style.display = "flex";
  document.getElementById("storeDLCInfo").classList.add("fadeIn");
  loadingOverlayHide();
  display = 9;
};

const showSkinInfo = (n) => {
  loadingOverlayShow();
  SkinInfoSkinName.textContent = document.getElementsByClassName(
    "storeSkinName"
  )[n].textContent;
  skinInfoPreview.src = `${cdn}/skins/preview/${skinData[n]}.png`;
  if (skins.indexOf(SkinInfoSkinName.textContent) != -1) {
    skinBasketButton.classList.add("storeButtonDisabled");
    skinBasketButton.disabled = true;
    skinBasketButton.textContent = purchased;
  } else if (carts.has(SkinInfoSkinName.textContent)) {
    skinBasketButton.classList.add("storeButtonDisabled");
    skinBasketButton.disabled = true;
    skinBasketButton.textContent = addedToBag;
  } else {
    skinBasketButton.classList.remove("storeButtonDisabled");
    skinBasketButton.disabled = false;
    skinBasketButton.textContent = addToBag;
  }
  document.getElementById("storeSkinInfo").style.display = "flex";
  document.getElementById("storeSkinInfo").classList.add("fadeIn");
  loadingOverlayHide();
  display = 10;
};

const cartDelete = async (type, item) => {
  loadingOverlayShow();
  await fetch(`${api}/store/bag`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({
      type: type,
      item: item,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result == "success") {
        cart = data.bag;
        updateCart(cart);
      } else {
        alert(`Error occured.\n${data.error}`);
      }
    });
};

const updateCart = async (cart) => {
  loadingOverlayShow();
  let langCode = 0;
  if (lang == "ko") {
    langCode = 0;
  } else if (lang == "ja") {
    langCode = 1;
  } else if (lang == "en") {
    langCode = 2;
  }
  if (!cart) {
    await fetch(`${api}/store/bag`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result == "success") {
          cart = data.bag.sort((a, b) => {
            return a.type > b.type ? 1 : -1;
          });
        } else {
          alert(`Error occured.\n${data.error}`);
        }
      })
      .catch((error) => {
        alert(`Error occured.\n${error}`);
        console.error(`Error occured.\n${error}`);
      });
  }
  let elements = "";
  cartArray = cart;
  carts = new Set();
  for (let i = 0; i < cart.length; i++) {
    carts.add(cart[i].item);
    elements += `<div class="storeColumnContainer">
                    <div class="storeBasketsContainer">
                        <div class="storeBasketsLeft">`;
    if (cart[i].type == "DLC") {
      await fetch(`${api}/store/DLC/${cart[i].item}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result == "success") {
            data = data.data;
            elements += `<img class="storeBasketsAlbum" src="${cdn}/dlc/${
              data.previewFile
            }.png">
                        <div class="storeBasketsInfo">
                            <span class="storeName">${data.name}</span>
                            <span class="storeSongArtist">${
                              data.composer
                            }</span>
                        </div>
                      </div>
                      <div class="storeBasketsRight">
                        <span class="storePrice">
                          ${getPriceText([], true, data, langCode)}
                        </span>
                        <img src="https://img.icons8.com/material-rounded/24/000000/delete-sign.png" class="storeDelete" onclick="cartDelete('DLC', '${
                          data.name
                        }')">`;
          } else {
            alert(`Error occured.\n${data.error}`);
          }
        })
        .catch((error) => {
          alert(`Error occured.\n${error}`);
          console.error(`Error occured.\n${error}`);
        });
    } else if (cart[i].type == "Skin") {
      await fetch(`${api}/store/skin/${cart[i].item}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result == "success") {
            data = data.data;
            elements += `<img src="${cdn}/skins/${
              data.previewFile
            }.png" class="storeBasketsSkin">
                        <div class="storeBasketsInfo">
                            <span class="storeName">${data.name}</span>
                        </div>
                      </div>
                      <div class="storeBasketsRight">
                        <span class="storePrice">
                          ${getPriceText([], true, data, langCode)}
                        </span>
                        <img src="https://img.icons8.com/material-rounded/50/000000/delete-sign.png" class="storeDelete" onclick="cartDelete('Skin', '${
                          data.name
                        }')">`;
          } else {
            alert(`Error occured.\n${data.error}`);
          }
        });
    }
    elements += `</div>
            </div>
        </div>`;
  }
  basketsButtonContainer.style.display = "flex";
  storeBasketsContainer.innerHTML = elements;
  if (cart.length == 0) {
    basketsButtonContainer.style.display = "none";
    storeBasketsContainer.innerHTML = `<div id="nothingHere"><span>${
      nothingHere.split("/")[0]
    }</span><span>${nothingHere.split("/")[1]}<strong>DLC</strong>${
      nothingHere.split("/")[2]
    }<strong>${nothingHere.split("/")[3]}</strong>${
      nothingHere.split("/")[4]
    }</span></div>`;
  }
  updateStore();
};

const storeMethod = () => {
  display = 11;
  overlayPaymentContainer.style.pointerEvents = "all";
  overlayPaymentContainer.style.opacity = "1";
};

const storePurchase = (method) => {
  overlayPaymentContainer.style.pointerEvents = "none";
  overlayPaymentContainer.style.opacity = "0";
  purchasingContainer.style.pointerEvents = "all";
  purchasingContainer.style.opacity = "1";
  fetch(`${api}/store/purchase`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      cart: cartArray,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      let international = !(lang == "ko");
      tossPayments.requestPayment(method, {
        amount: data.amount,
        orderId: data.orderId,
        orderName: "URLATE 상점 결제",
        customerName: username,
        customerEmail: data.email,
        successUrl: `${api}/store/success`,
        failUrl: `${api}/store/fail`,
        useInternationalCardOnly: international,
      });
      purchasingContainer.style.pointerEvents = "none";
      purchasingContainer.style.opacity = "0";
    })
    .catch((error) => {
      purchasingContainer.style.pointerEvents = "none";
      purchasingContainer.style.opacity = "0";
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
};

const getPriceText = (array, ignoreCart, data, langCode) => {
  let priceData = "";
  if (array.indexOf(data.name) != -1) {
    priceData = purchased;
  } else if (carts.has(data.name) && !ignoreCart) {
    priceData = addedToBag;
  } else if (isAdvanced) {
    let originalPrice = numberWithCommas(JSON.parse(data.price)[0]) + "₩";
    let saledPrice =
      numberWithCommas(
        Math.round(JSON.parse(data.price)[0] * 0.8 * data.sale) / 100
      ) + "₩";
    if (langCode) {
      saledPrice += `(${
        numberWithCommas(
          Math.round(JSON.parse(data.price)[langCode] * 0.8 * data.sale) / 100
        ) + currency
      })`;
    }
    priceData = `<span class="storePriceSale">${originalPrice}</span>${saledPrice}`;
  } else {
    let originalPrice = numberWithCommas(JSON.parse(data.price)[0]) + "₩";
    let saledPrice = "";
    if (data.sale != "100") {
      saledPrice =
        numberWithCommas(
          Math.round(JSON.parse(data.price)[0] * data.sale) / 100
        ) + "₩";
    }
    if (saledPrice == "") {
      priceData = originalPrice;
    } else {
      priceData = `<span class="storePriceSale">${originalPrice}</span>${saledPrice}`;
    }
    if (langCode) {
      priceData += `(${
        numberWithCommas(
          Math.round(JSON.parse(data.price)[langCode] * data.sale) / 100
        ) + currency
      })`;
    }
  }
  return priceData;
};

const updateStore = () => {
  let langCode = 0;
  if (lang == "ko") {
    langCode = 0;
  } else if (lang == "ja") {
    langCode = 1;
  } else if (lang == "en") {
    langCode = 2;
  }
  fetch(`${api}/store/DLCs`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      DLCdata = [];
      data = data.data;
      let elements = "";
      for (let i = 0; i < data.length / 2; i++) {
        elements += '<div class="storeRowContainer">';
        for (let j = 0; j < 2; j++) {
          if (data[i * 2 + j]) {
            DLCdata[i * 2 + j] = JSON.parse(data[i * 2 + j].songs);
            elements += `<div class="storeSongsContainer" onclick="showDLCinfo(${
              i * 2 + j
            })">
                        <div class="storeSongsLeft">
                          <img class="storeSongsAlbum" src="${cdn}/dlc/${
              data[i * 2 + j].previewFile
            }.png">
                        </div>
                        <div class="storeSongsRight">
                          <div class="storeSongsTop">
                            <span class="storeName">${
                              data[i * 2 + j].name
                            }</span>
                            <span class="storeSongArtist">${
                              data[i * 2 + j].composer
                            }</span>
                          </div>
                          <div class="storeSongsBottom">
                            <span class="storePrice">${getPriceText(
                              DLCs,
                              false,
                              data[i * 2 + j],
                              langCode
                            )}</span>
                          </div>
                        </div>
                      </div>`;
          } else {
            elements += `<div class="storeSongsContainer"></div>`;
          }
        }
        elements += "</div>";
      }
      document.getElementsByClassName(
        "storeContentsContainer"
      )[0].innerHTML = elements;
      loadingOverlayHide();
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
  fetch(`${api}/store/skins`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      skinData = [];
      data = data.data;
      let elements = "";
      for (let i = 0; i < data.length / 2; i++) {
        elements += '<div class="storeRowContainer">';
        for (let j = 0; j < 2; j++) {
          if (data[i * 2 + j]) {
            skinData[i * 2 + j] = JSON.parse(data[i * 2 + j].previewFile);
            elements += `<div class="storeSkinsContainer" onclick="showSkinInfo(${
              i * 2 + j
            })">
                        <div class="storeSkinTitleContainer">
                          <span class="storeSkinName">${
                            data[i * 2 + j].name
                          }</span>
                        </div>
                        <div class="storeSkinContentContainer">
                          <img src="${cdn}/skins/${
              data[i * 2 + j].previewFile
            }.png" class="storeSkin">
                        </div>
                        <div class="storeSkinPriceContainer">
                        <span class="storePrice">${getPriceText(
                          skins,
                          false,
                          data[i * 2 + j],
                          langCode
                        )}</span>
                        </div>
                      </div>`;
          } else {
            elements += `<div class="storeSkinsContainer"></div>`;
          }
        }
        elements += "</div>";
      }
      document.getElementsByClassName(
        "storeContentsContainer"
      )[1].innerHTML = elements;
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
};

const addToCart = (s) => {
  fetch(`${api}/store/bag`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      type: s,
      item: document.getElementById(`${s}Info${s}Name`).textContent,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result != "success") {
        alert(`Error occured.\n${data.error}`);
      } else {
        if (s == "DLC") {
          DLCbasketButton.classList.add("storeButtonDisabled");
          DLCbasketButton.disabled = true;
          DLCbasketButton.textContent = addedToBag;
        } else if (s == "Skin") {
          skinBasketButton.classList.add("storeButtonDisabled");
          skinBasketButton.disabled = true;
          skinBasketButton.textContent = addedToBag;
        }
        updateCart(data.bag);
      }
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
      console.error(`Error occured.\n${error}`);
    });
};

const menuSelected = (n) => {
  if (n == 0) {
    //play
    display = 1;
    if (songSelection == -1) {
      let min = Math.ceil(0);
      let max = Math.floor(tracks.length);
      songSelected(Math.floor(Math.random() * (max - min)) + min);
    }
    document.getElementById("selectContainer").style.display = "flex";
    document.getElementById("selectContainer").classList.add("fadeIn");
  } else if (n == 1) {
    //editor
    window.location.href = `${url}/editor`;
  } else if (n == 2) {
    //advanced
    display = 3;
    document.getElementById("advancedContainer").style.display = "block";
    document.getElementById("advancedContainer").classList.add("fadeIn");
  } else if (n == 3) {
    //store
    document.getElementById("storeContainer").style.display = "block";
    document.getElementById("storeContainer").classList.add("fadeIn");
    updateCart();
    display = 8;
  }
};

const getAdvanced = () => {
  purchasingContainer.style.pointerEvents = "all";
  purchasingContainer.style.opacity = "1";
  tossPayments.requestBillingAuth("카드", {
    customerKey: userid,
    successUrl: `${api}/billing/success`,
    failUrl: `${api}/store/fail`,
  });
  purchasingContainer.style.pointerEvents = "none";
  purchasingContainer.style.opacity = "0";
};

const optionSelect = (n) => {
  document
    .getElementsByClassName("optionSelected")[0]
    .classList.remove("optionSelected");
  document
    .getElementsByClassName("optionSelectors")
    [n].classList.add("optionSelected");
  document
    .getElementsByClassName("optionShow")[0]
    .classList.remove("optionShow");
  document
    .getElementsByClassName("optionContentsContainer")
    [n].classList.add("optionShow");
};

const storeSelect = (n) => {
  document
    .getElementsByClassName("storeSelected")[0]
    .classList.remove("storeSelected");
  document
    .getElementsByClassName("storeSelectors")
    [n].classList.add("storeSelected");
  document.getElementsByClassName("storeShow")[0].classList.remove("storeShow");
  document
    .getElementsByClassName("storeContentsContainer")
    [n].classList.add("storeShow");
};

const langChanged = (e) => {
  window.location.href = `${url}/${e.value}`;
};

const logout = (e) => {
  window.location.href = `${api}/auth/logout?redirect=true`;
};

const settingChanged = (e, v) => {
  if (v == "detailLang") {
    settings.general.detailLang = e.value;
  } else if (v == "canvasRes") {
    settings.display.canvasRes = Number(e.value);
  } else if (v == "albumRes") {
    settings.display.albumRes = Number(e.value);
  } else if (v == "volumeMaster") {
    settings.sound.volume.master = e.value / 100;
    for (let i = 0; i <= 1; i++) {
      volumeMasterValue[i].textContent = e.value + "%";
    }
    overlayTime = new Date().getTime();
    setTimeout(() => {
      overlayClose("volume");
    }, 1500);
    Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
    intro1video.volume =
      settings.sound.volume.master * settings.sound.volume.music;
  } else if (v == "volumeSong") {
    settings.sound.volume.music = e.value / 100;
    volumeSongValue.textContent = e.value + "%";
    Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
  } else if (v == "volumeHitsound") {
    settings.sound.volume.hitSound = e.value / 100;
    volumeHitValue.textContent = e.value + "%";
  } else if (v == "volumeEffect") {
    settings.sound.volume.effect = e.value / 100;
    volumeEftValue.textContent = e.value + "%";
  } else if (v == "soundRes") {
    settings.sound.res = e.value;
  } else if (v == "sensitive") {
    settings.input.sens = e.value / 100;
    sensitiveValue.textContent = e.value / 100 + "x";
  } else if (v == "inputKey") {
    settings.input.keys = Number(e.value);
  } else if (v == "inputMouse") {
    settings.input.mouse = e.checked;
  } else if (v == "skin") {
    settings.game.skin = e.value;
  } else if (v == "judgeSkin") {
    settings.game.judgeSkin = e.checked;
  } else if (v == "inputSize") {
    settings.game.size = e.value / 10;
    inputSizeValue.textContent = e.value / 10 + "x";
  } else if (
    v == "Perfect" ||
    v == "Great" ||
    v == "Good" ||
    v == "Bad" ||
    v == "Miss" ||
    v == "Bullet"
  ) {
    settings.game.applyJudge[v] = e.checked;
  } else if (v == "frameCounter") {
    settings.game.counter = e.checked;
  } else if (v == "comboAlert") {
    settings.game.comboAlert = e.checked;
  } else if (v == "comboCount") {
    settings.game.comboCount = parseInt(e.value);
  } else if (v == "ignoreCursor") {
    settings.editor.denyCursor = e.checked;
  } else if (v == "ignoreEditor") {
    settings.editor.denySkin = e.checked;
  } else if (v == "ignoreTest") {
    settings.editor.denyAtTest = e.checked;
  }
};

const showProfile = (name) => {
  loadingShow();
  document.getElementById("infoProfileContainer").style.display = "flex";
  document.getElementById("infoProfileContainer").classList.add("fadeIn");
  fetch(`${api}/teamProfile/${name}`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      let info = JSON.parse(data.data);
      infoProfileName.textContent = info[0].name;
      infoProfilePosition.textContent = info[0].position;
      infoProfileImg.src = `images/credits/${info[0].profile}`;
      let innerHTML = `<div class="infoProfilePart">
                          <img src="https://img.icons8.com/small/64/333333/comma.png" class="infoIcon">
                          <span id="quote">${info[0].quote}</span>
                     </div>`;
      for (let i = 1; i < info.length; i++) {
        let link = "";
        if (info[i].icon.indexOf("soundcloud") != -1) {
          link = `https://soundcloud.com/${info[i].content}`;
        } else if (info[i].icon.indexOf("youtube") != -1) {
          if (info[i].link != undefined) {
            link = info[i].link;
          }
        } else if (info[i].icon.indexOf("web") != -1) {
          link = `https://${info[i].content}`;
        } else if (info[i].icon.indexOf("github") != -1) {
          link = `https://github.com/${info[i].content}`;
        } else if (info[i].icon.indexOf("twitter") != -1) {
          link = `https://twitter.com/${info[i].content}`;
        } else if (info[i].icon.indexOf("telegram") != -1) {
          link = `https://t.me/${info[i].content}`;
        } else if (info[i].icon.indexOf("instagram") != -1) {
          link = `https://www.instagram.com/${info[i].content}`;
        } else if (info[i].icon.indexOf("email") != -1) {
          link = `mailto:${info[i].content}`;
        }
        innerHTML += `
                    <div class="infoProfilePart">
                        <img src="https://img.icons8.com/${
                          info[i].icon.split("/")[0]
                        }/64/333333/${
          info[i].icon.split("/")[1]
        }.png" class="infoIcon">
                        ${
                          link == ""
                            ? `<span>`
                            : `<a class="blackLink" href="${link}" target="_blank">`
                        }${info[i].content}${link == "" ? `</span>` : `</a>`}
                    </div>`;
      }
      infoProfileBottom.innerHTML = innerHTML;
      loadingHide();
      display = 5;
    })
    .catch((error) => {
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
  speedValue.style.width = `${(speeds[difficultySelection] / 5) * 100}%`;
  let starText = "";
  for (let i = 0; i < difficulties[difficultySelection]; i++) {
    starText += "★";
  }
  for (let i = difficulties[difficultySelection]; i < 10; i++) {
    starText += "☆";
  }
  selectStars.textContent = starText;
  selectScoreValue.textContent = numberWithCommas(
    `${trackRecords[n][difficultySelection].record}`.padStart(9, "0")
  );
  document.getElementsByClassName("ranks")[n].className = "ranks";
  document
    .getElementsByClassName("ranks")
    [n].classList.add(trackRecords[n][difficultySelection].rank);
  let recordMedal = trackRecords[n][difficultySelection].medal;
  goldMedal.style.opacity = "0.1";
  silverMedal.style.opacity = "0.1";
  checkMedal.style.opacity = "0.1";
  if (recordMedal >= 4) {
    goldMedal.style.opacity = "1";
    recordMedal -= 4;
  }
  if (recordMedal >= 2) {
    silverMedal.style.opacity = "1";
    recordMedal -= 2;
  }
  if (recordMedal >= 1) {
    checkMedal.style.opacity = "1";
  }
};

const difficultySelected = (n) => {
  difficultySelection = n;
  document
    .getElementsByClassName("difficultySelected")[0]
    .classList.remove("difficultySelected");
  document
    .getElementsByClassName("difficulty")
    [n].classList.add("difficultySelected");
  updateDetails(songSelection);
  updateRanks();
};

const showRank = () => {
  isRankOpened = true;
  display = 6;
  document.getElementById("selectRankContainer").style.opacity = "1";
  document.getElementById("selectRankContainer").style.pointerEvents =
    "visible";
  document.getElementById("selectRankInnerContainer").classList.add("visible");
};

const offsetSetting = () => {
  display = 7;
  document.getElementById("offsetContiner").style.display = "flex";
  document.getElementById("offsetContiner").classList.add("fadeIn");
  if (songSelection != -1) {
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
  let remain =
    ((offsetSong.seek() % beat <= beat / 1.5
      ? offsetSong.seek() % beat
      : (offsetSong.seek() % beat) - beat) *
      1000) /
    offsetRate;
  let fillColor = "#373737";
  if (offsetSong.seek() <= beat + 0.005) fillColor = "#e56464";
  if (-50 <= remain && remain <= 0) {
    offsetNextCircle.style.backgroundColor = "#ffffff";
    offsetPrevCircle.style.backgroundColor = fillColor;
  } else if (0 <= remain && remain <= 50) {
    offsetPrevCircle.style.backgroundColor = "#ffffff";
    offsetTimingCircle.style.backgroundColor = fillColor;
  } else if (50 <= remain && remain <= 100) {
    offsetTimingCircle.style.backgroundColor = "#ffffff";
    offsetNextCircle.style.backgroundColor = fillColor;
  } else {
    offsetTimingCircle.style.backgroundColor = "#ffffff";
    offsetPrevCircle.style.backgroundColor = "#ffffff";
    offsetNextCircle.style.backgroundColor = "#ffffff";
  }
  if (offsetInput) {
    offsetInputCircle.style.backgroundColor = fillColor;
    if (!offsetPrevInput) {
      if (
        offsetAverage[offsetAverage.length - 1] - remain >= 50 ||
        offsetAverage[offsetAverage.length - 1] + remain <= -50
      ) {
        offsetAverage = [];
      }
      offsetAverage.push(parseInt(remain));
      let avr = 0;
      for (
        let i = offsetAverage.length - 1;
        i >= (offsetAverage.length - 10 < 0 ? 0 : offsetAverage.length - 10);
        i--
      ) {
        avr += offsetAverage[i];
      }
      avr = avr / (offsetAverage.length >= 10 ? 10 : offsetAverage.length);
      offset = parseInt(avr);
      offsetButtonText.textContent = offset + "ms";
    }
  } else {
    offsetInputCircle.style.backgroundColor = "#ffffff";
  }
  if (offset <= remain && remain <= offset + 50) {
    offsetOffsetCircle.style.backgroundColor = fillColor;
  } else {
    offsetOffsetCircle.style.backgroundColor = "#ffffff";
  }
  offsetPrevInput = offsetInput;
  if (display == 7) {
    window.requestAnimationFrame(offsetUpdate);
  } else {
    offsetAverage = [];
    offsetPrevInput = false;
    offsetInput = false;
  }
};

const offsetSpeedUp = () => {
  offsetRate = Number((offsetRate + 0.1).toFixed(1));
  if (offsetRate > 2) offsetRate = 2;
  offsetSong.rate(offsetRate);
  offsetSpeedText.textContent = offsetRate + "x";
};

const offsetSpeedDown = () => {
  offsetRate = Number((offsetRate - 0.1).toFixed(1));
  if (offsetRate <= 0) offsetRate = 0.1;
  offsetSong.rate(offsetRate);
  offsetSpeedText.textContent = offsetRate + "x";
};

const offsetUp = () => {
  offset += 5;
  if (!offset) {
    offsetButtonText.textContent = "TAP";
  } else {
    offsetButtonText.textContent = offset + "ms";
  }
};

const offsetDown = () => {
  offset -= 5;
  if (!offset) {
    offsetButtonText.textContent = "TAP";
  } else {
    offsetButtonText.textContent = offset + "ms";
  }
};

const offsetReset = () => {
  offset = 0;
  offsetButtonText.textContent = "TAP";
  offsetAverage = [];
};

const offsetButtonDown = () => {
  offsetInput = true;
};

const offsetButtonUp = () => {
  offsetInput = false;
};

const overlayClose = (s) => {
  if (s == "volume") {
    if (overlayTime + 1400 <= new Date().getTime()) {
      volumeOverlay.classList.remove("overlayOpen");
    }
  }
};

const couponEnter = () => {
  display = 12;
  overlayCodeContainer.style.pointerEvents = "all";
  overlayCodeContainer.style.opacity = "1";
};

const couponApply = () => {
  if (codeInput.value != "") {
    overlayLoadingContainer.style.pointerEvents = "all";
    overlayLoadingContainer.style.opacity = "1";
    fetch(`${api}/coupon`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({
        code: codeInput.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result == "success") {
          alert(couponApplySuccess);
          location.reload();
        } else if (data.result == "failed") {
          if (data.error == "Invalid code") {
            alert(`${couponInvalid1}\n${couponInvalid2}`);
          } else if (data.error == "Used code") {
            alert(couponUsed);
          } else if (data.error == "Already subscribed") {
            alert(`${alreadySubscribed1}\n${alreadySubscribed2}`);
          } else {
            alert(`Error occured.\n${data.description}`);
            console.error(`Error occured.\n${data.description}`);
          }
        } else {
          alert(`Error occured.`);
          console.error(`Error occured.`);
        }
        overlayLoadingContainer.style.pointerEvents = "none";
        overlayLoadingContainer.style.opacity = "0";
      })
      .catch((error) => {
        alert(`Error occured.\n${error}`);
        console.error(`Error occured.\n${error}`);
        overlayLoadingContainer.style.pointerEvents = "none";
        overlayLoadingContainer.style.opacity = "0";
      });
  } else {
    alert(`${inputEmpty}`);
  }
};

const scrollEvent = (e) => {
  if (shiftDown) {
    e = window.event || e;
    let delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    if (delta == 1) {
      //UP
      if (settings.sound.volume.master <= 0.95) {
        settings.sound.volume.master =
          Math.round((settings.sound.volume.master + 0.05) * 100) / 100;
      } else {
        settings.sound.volume.master = 1;
      }
    } else {
      //DOWN
      if (settings.sound.volume.master >= 0.05) {
        settings.sound.volume.master =
          Math.round((settings.sound.volume.master - 0.05) * 100) / 100;
      } else {
        settings.sound.volume.master = 0;
      }
    }
    for (let i = 0; i <= 1; i++) {
      volumeMaster[i].value = Math.round(settings.sound.volume.master * 100);
      volumeMasterValue[i].textContent = `${Math.round(
        settings.sound.volume.master * 100
      )}%`;
    }
    Howler.volume(settings.sound.volume.master * settings.sound.volume.music);
    intro1video.volume =
      settings.sound.volume.master * settings.sound.volume.music;
    volumeOverlay.classList.add("overlayOpen");
    overlayTime = new Date().getTime();
    setTimeout(() => {
      overlayClose("volume");
    }, 1500);
    fetch(`${api}/settings`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({
        settings: settings,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result != "success") {
          alert(`Error occured.\n${data.error}`);
        }
      })
      .catch((error) => {
        alert(`Error occured.\n${error}`);
        console.error(`Error occured.\n${error}`);
      });
  }
};

document.onkeydown = (e) => {
  e = e || window.event;
  let key = e.key.toLowerCase();
  //console.log(key);
  if (key == "escape") {
    e.preventDefault();
    displayClose();
    return;
  }
  if (key == "shift") {
    shiftDown = true;
  }
  if (display == 0) {
    if (key == "arrowleft") {
      e.preventDefault();
      //menuLeft();
    } else if (key == "arrowright") {
      e.preventDefault();
      //menuRight();
    } else if (key == "enter" || key == " ") {
      e.preventDefault();
      //menuSelected();
    }
  } else if (display == 1 || display == 6) {
    if (key == "arrowup") {
      e.preventDefault();
      if (songSelection != 0) songSelected(songSelection - 1);
    } else if (key == "arrowdown") {
      e.preventDefault();
      if (songSelection < tracks.length - 1) songSelected(songSelection + 1);
    } else if (key == "tab") {
      e.preventDefault();
      difficultySelected(
        difficultySelection + 1 == 3 ? 0 : difficultySelection + 1
      );
    } else if (key == "enter") {
      e.preventDefault();
      songSelected(songSelection);
    } else if (key == "f2") {
      e.preventDefault();
      if (isRankOpened) {
        displayClose();
      } else {
        showRank();
      }
    }
  } else if (display == 7) {
    offsetInput = true;
  }
};

document.onkeyup = (e) => {
  e = e || window.event;
  let key = e.key.toLowerCase();
  if (display == 7) {
    offsetInput = false;
  }
  if (key == "shift") {
    shiftDown = false;
  }
};

window.addEventListener("resize", initialize);
window.addEventListener("mousewheel", scrollEvent);
window.addEventListener("DOMMouseScroll", scrollEvent);

window.onpopstate = () => {
  if (display != 0) {
    displayClose();
    history.pushState("anotherAwesomeState", null, null);
  } else {
    history.back();
  }
};
