var isBlocked = false;
var whIsBlocked = false;
var isStarted = false;

var screenName = 'home';
var gifName = 'selbox.gif';

function isTooSmall() {
  if(window.innerHeight / window.innerWidth < 0.4) {
    if(whIsBlocked == false) {
      document.getElementById("sorry").style.visibility = "visible";
      whIsBlocked = true;
    }
  } else if(window.innerHeight / window.innerWidth <= 0.42) {
    document.getElementById('mode').style.marginTop = '2vh';
    if(whIsBlocked == true) {
      document.getElementById("sorry").style.visibility = "hidden";
      whIsBlocked = false;
    }
  } else if(window.innerHeight / window.innerWidth <= 0.47) {
    document.getElementById('mode').style.marginTop = '1vh';
    if(whIsBlocked == true) {
      document.getElementById("sorry").style.visibility = "hidden";
      whIsBlocked = false;
    }
  } else {
    document.getElementById('mode').style.marginTop = '0vh';
    if(whIsBlocked == true && isBlocked == false) {
      document.getElementById("sorry").style.visibility = "hidden";
      whIsBlocked = false;
    }
  }

  if(window.innerWidth >= 2200) {
    gifName = 'selbox_high.gif';
  } else {
    gifName = 'selbox.gif';
  }

  if(window.innerWidth < 1300 || window.innerHeight < 700) {
    if(isBlocked == false) {
      document.getElementById("sorry").style.visibility = "visible";
      isBlocked = true;
    }
  } else {
    if(isBlocked == true && whIsBlocked == false) {
      document.getElementById("sorry").style.visibility = "hidden";
      isBlocked = false;
    }
  }
}

isTooSmall();

var fpsSum = 0, fpsAvg = 0, fpsTime = 0;

const times = [];
let fps;

function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    if(fpsAvg + 10 <= fps) {
      fpsTime = 0;
      fpsSum = 0;
      fpsAvg = 0;
    }
    refreshLoop();
  });
}

refreshLoop();

function fpsLoop() {
  fpsTime = fpsTime + 1;
  fpsSum = fpsSum + fps;
  fpsAvg = Math.round(fpsSum / fpsTime);
  if(fpsAvg -30 >= fps) {
    document.getElementById("fps").style.backgroundColor = "#f4511e";
  } else if(fpsAvg -20 >= fps) {
    document.getElementById("fps").style.backgroundColor = "#ffc107";
  } else if(fpsAvg -10 >= fps) {
    document.getElementById("fps").style.backgroundColor = "#c0ca33";
  } else {
    document.getElementById("fps").style.backgroundColor = "#66bb6a";
  }
  document.getElementById("fpsValue").innerHTML = "&nbsp;" + fps + "<span style='font-size: 13px;'>/" + fpsAvg + "</span>";
}

function pad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

var d, n, o, ping;
function pingLoop() {
  d = new Date();
  n = d.getTime();
  $.get("ping", function(data, status){
    d = new Date();
    o = d.getTime();
    ping = pad(o - n, 2);
    document.getElementById("pingValue").innerHTML = "&nbsp;" + ping;
  });
}

var bgm1 = new Howl({
  src: ['Songs/MyRhyThemeSong_ver2_edited.mp3'],
  onend: function() {
    bgm2.play();
  }
});

var bgm2 = new Howl({
  src: ['Songs/MyRhyThemeSong_ver2_edited_cutted.mp3'],
  loop: true
});

bgm1.once('load', function() {
  if(isStarted == false) {
    bgm1.play();
  }
});

var menu = 0;

var songName = [];
var prodName = [];
var BPM = [];
var difficulty = [];
var albumArtFile = [];
var songList = [];
var songs = [];
var shortName = [];
var photos = [];
var userScores = [];
var userRanks = [];
var userCombos = [];
var userRecRanks = [];
var serverSongName = [];
var songCount;
var nowMusic;
var mode = 0;
var modeName = ['Complex', 'Harder', 'Click'];
var selLevel;
var levelList;

jQuery.get('/otherFiles/songs.txt', function(data) {
  var str = data.split(';');
  songCount = str.length - 2;
  for(var i = 1; i <= songCount; i++) {
    var sstr = str[i].split('|');
    songName[i-1] = sstr[0];
    shortName[i-1] = sstr[6];
    serverSongName[i-1] = sstr[7];
    var t = shortName[i-1];
    if(typeof record !== 'undefined') {
      if(typeof record[t] !== 'undefined') {
        userScores[i-1] = pad(record[t].score, 8);
        userRanks[i-1] = record[t].rank;
        userCombos[i-1] = record[t].combo;
        userRecRanks[i-1] = record[t].recRank;
      } else {
        userScores[i-1] = '00000000';
        userRanks[i-1] = 'U';
        userCombos[i-1] = '0';
        userRecRanks[i-1] = '0';
      }
    } else {
      userScores[i-1] = '00000000';
      userRanks[i-1] = 'U';
      userCombos[i-1] = '0';
      userRecRanks[i-1] = '0';
    }

    prodName[i-1] = sstr[2];
    if(sstr[3].indexOf('/') !== -1) {
      var tmp = sstr[3].split('/');
      BPM[i-1] = tmp[0];
    } else {
      BPM[i-1] = sstr[3];
    }
    difficulty[i-1] = sstr[4];
    albumArtFile[i-1] = 'photos/albumArt/' + sstr[5];
    songList[i-1] = 'Songs/GameSongs/' + sstr[1];
    songs[i-1] = new Howl({
      src: songList[i-1],
      loop: true
    });
    document.getElementById("songListContainer").innerHTML = document.getElementById("songListContainer").innerHTML + `<div class="songs" id="song_${i-1}" onclick="selMusic(${i-1})"> <span class="title">${songName[i-1]}</span> <div style="height: 5px;"> </div> <span class="prod">${prodName[i-1]}</span> </div>`;
  }
});

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

paceOptions = {
  elements: false,
  restartOnRequestAfter: false
};


Pace.on('done', function() {
  if(isStarted == false) {
    isStarted = true;
    setInterval(pingLoop, 1000);
    setInterval(fpsLoop, 200);
    bgm1.fade(1, 0, 2000);
    $("#loading").fadeOut(1000, function() {
      $("#copyright").fadeIn(1000);
      $("#main").fadeIn(1000, function() {
        bgm1.stop();
        bgm2.stop();
        nowMusic = getRandom(1,songCount) - 1;
        songs[nowMusic].play();
        songs[nowMusic].fade(0, 1, 5000);
        document.getElementById('bottomLogo').style.animationDuration = (60 / BPM[nowMusic]) + "s";
        document.getElementById('nowPlaying').innerHTML = songName[nowMusic];
        $("#nowPlaying").fadeIn(500);
        document.getElementById(`song_${nowMusic}`).className = "songs selectedSong";
        document.getElementById("albumArt").src = albumArtFile[nowMusic];
        document.getElementById("level").innerHTML = difficulty[nowMusic];
        document.getElementById("userScoreText").innerHTML = userScores[nowMusic];
        document.getElementById("userComboText").innerHTML = `x${userCombos[nowMusic]}`;
        document.getElementById("userRankText").innerHTML = `#${userRecRanks[nowMusic]}`;
        document.getElementById("rankImage").src = `photos/tempImages/rank_${userRanks[nowMusic]}.png`;
      });
    });
  }
});

function settings() {
  $("#settings").fadeIn(500);
}

function settingsOff() {
  $("#settings").fadeOut(500);
}

function info() {
  $("#info").fadeIn(500);
}

function infoOff() {
  $("#info").fadeOut(500);
}

function nextIco() {
  if(menu == 0) {
    menu = 1;
    $("#startGame").fadeOut(100, function() {
      $("#ranking").fadeIn(100);
    });
  } else if(menu == 1) {
    menu = 2;
    $("#ranking").fadeOut(100, function() {
      $("#editor").fadeIn(100);
    });
  } else if(menu == 2) {
    menu = 0;
    $("#editor").fadeOut(100, function() {
      $("#startGame").fadeIn(100);
    });
  }
}

function prevIco() {
  if(menu == 0) {
    menu = 2;
    $("#startGame").fadeOut(100, function() {
      $("#editor").fadeIn(100);
    });
  } else if(menu == 1) {
    menu = 0;
    $("#ranking").fadeOut(100, function() {
      $("#startGame").fadeIn(100);
    });
  } else if(menu == 2) {
    menu = 1;
    $("#editor").fadeOut(100, function() {
      $("#ranking").fadeIn(100);
    });
  }
}

function startGame() {
  screenName = 'songs';
  songs[nowMusic].fade(1, 0.1, 500);
    $("#main").fadeOut(500, function() {
      songs[nowMusic].pause();
      songs[nowMusic].play();
      songs[nowMusic].fade(0.1, 1, 500);
      $("#selSong").fadeIn(500, function() {
        document.getElementsByClassName("songs selectedSong")[0].style.backgroundImage = `url("/photos/tempImages/${gifName}` + '?a=' + Math.random() + '")';
      });
    });
}

function selMusic(musicID) {
  if(musicID == nowMusic) {
    screenName = "confirm";
    levelList = difficulty[nowMusic].split('/');
    selLevel = 0;
    document.getElementById('testLevel').textContent = levelList[0];
    $("#confirm").fadeIn(500);
  } else {
    document.getElementsByClassName("songs selectedSong")[0].style.backgroundImage = '';
    document.getElementById('nowPlaying').innerHTML = songName[musicID];
    changeINFOphoto(musicID);
    changeRANKphoto(musicID);
    for(var i = 1; i <= songCount; i++) {
      document.getElementById(`song_${i-1}`).className = "songs";
    }
    document.getElementById(`song_${musicID}`).className = "songs selectedSong";
    songs[musicID].fade(1, 0, 500);
    setTimeout(function(){
      songs[nowMusic].stop();
      nowMusic = musicID;
      songs[nowMusic].play();
      songs[nowMusic].fade(0, 1, 500);
      document.getElementById("level").innerHTML = difficulty[nowMusic];
      document.getElementById("userScoreText").innerHTML = userScores[nowMusic];
      document.getElementById("userComboText").innerHTML = `x${userCombos[nowMusic]}`;
      document.getElementById("userRankText").innerHTML = `#${userRecRanks[nowMusic]}`;
      document.getElementsByClassName("songs selectedSong")[0].style.backgroundImage = `url("/photos/tempImages/${gifName}` + '?a=' + Math.random() + '")';
    }, 500);
    document.getElementById('bottomLogo').style.animationDuration = (60 / BPM[musicID]) + "s";
  }
}

function changeRANKphoto(musicID) {
  $("#rankImage").fadeOut(250);
  setTimeout(function(){
    document.getElementById("rankImage").src = `photos/tempImages/rank_${userRanks[musicID]}.png`;
    $("#rankImage").fadeIn(250);
  }, 250);
}

function changeINFOphoto(musicID) {
  $("#albumArt").fadeOut(250);
  setTimeout(function(){
    document.getElementById("albumArt").src = albumArtFile[musicID];
    $("#albumArt").fadeIn(250);
  }, 250);
}

var isModeDropDownEnabled = false;

function modeDropDown() {
  if(isModeDropDownEnabled) {
    isModeDropDownEnabled = false;
    document.getElementById("dropDownArrow").style.transform = "rotate(0deg)";
    document.getElementById("dropDownArrow").style.filter = "invert(0%)";
    document.getElementById("mode").style.backgroundColor = "rgb(20,20,20)";
    document.getElementById("mode").style.color = "rgb(245,245,245)";
    document.getElementById("tracksIcon").src = "photos/tempImages/tracks.png";
    document.getElementById("mode").style.width = "60%";
    document.getElementById("mode").style.paddingBottom = "2px";
    document.getElementById("mode").style.paddingTop = "2px";
    document.getElementById("mode").style.borderRadius = "2px";
    $("#background_darker").fadeOut(500);
    $("#subMode").fadeOut(500);
  } else {
    isModeDropDownEnabled = true;
    document.getElementById("dropDownArrow").style.transform = "rotate(180deg)";
    document.getElementById("dropDownArrow").style.filter = "invert(100%)";
    document.getElementById("mode").style.backgroundColor = "rgb(245,245,245)";
    document.getElementById("mode").style.color = "rgb(20,20,20)";
    document.getElementById("tracksIcon").src = "photos/tempImages/tracks_light.png";
    document.getElementById("mode").style.width = "80%";
    document.getElementById("mode").style.paddingBottom = "4px";
    document.getElementById("mode").style.paddingTop = "4px";
    document.getElementById("mode").style.borderRadius = "5px";
    $("#subMode").fadeIn(500);
    $("#background_darker").fadeIn(500);
  }
}

function testLevel() {
  selLevel += 1;
  if(selLevel >= levelList.length) {
    selLevel = 0;
  }
  document.getElementById('testLevel').textContent = levelList[selLevel];
}

function testConfirm() {
  $("#fadeOut").fadeIn(500, function() {
    window.location.href = '/play/' + serverSongName[nowMusic] + '/' + modeName[mode] + '/' + levelList[selLevel];
  });
}

Howler.volume(0.3);

document.addEventListener('keydown', keyPressed);

function keyPressed(e) {
  if(e.code.toLowerCase() == "escape" || e.code.toLowerCase() == "esc" ) {
    if(screenName == "songs") {
      screenName = 'home';
      songs[nowMusic].fade(1, 0.1, 500);
        $("#selSong").fadeOut(500, function() {
          songs[nowMusic].pause();
          songs[nowMusic].play();
          songs[nowMusic].fade(0.1, 1, 500);
          $("#main").fadeIn(500);
        });
    } else if(screenName == "confirm") {
      screenName = 'songs';
      $("#confirm").fadeOut(500);
    }
  }
}
