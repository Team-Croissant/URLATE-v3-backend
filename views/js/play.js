var loadFinished = false;
var isFadeOuted = false;
var speed = 3 / 5;
var updateTime;
var noteLoc = window.innerWidth + (window.innerWidth / 20);
document.getElementById("noteArea").style.transform = `translateX(${noteLoc}px)`;
var isStop = false;
var sync = 0;

setTimeout(function() {
  if(loadFinished == true) {
    $("#loading").fadeOut(1000, function() { isFadeOuted = true; });
  } else {
    loadFinished = true;
  }
}, 4000);

var prodName = [],
    BPM = [],
    songName = [],
    albumArtFile = [],
    displayName = [];
var song;
var songPath = [];
var bpm;
var tempo;
var tempoPerBeat;
var beat;
var bpmData = [];
var str;
var totalBeat;
var songLoaded = false;

jQuery.get('/otherFiles/songs.txt', function(data) {
  str = data.split(';');
  var songCount = str.length - 2;
  for(var i = 1; i <= songCount; i++) {
    var sstr = str[i].split('|');
    displayName[i-1] = sstr[0];
    songName[i-1] = sstr[7];
    prodName[i-1] = sstr[2];
    songPath[i-1] = sstr[1];
    if(sstr[3].indexOf('/') !== -1) {
      var tmp = sstr[3].split('/');
      BPM[i-1] = tmp[0];
    } else {
      BPM[i-1] = sstr[3];
    }
    albumArtFile[i-1] = '/photos/albumArt/' + sstr[5];
  }
  var songLoc = songName.indexOf(varSongName);
  prodName = prodName[songLoc];
  BPM = prodName[songLoc];
  albumArtFile = albumArtFile[songLoc];
  displayName = displayName[songLoc];
  songPath = songPath[songLoc];
  songPath = songPath.replace("_short", "");
  songPath = '/Songs/GameSongs/' + songPath;
  song = new Howl({
    src: songPath
  });
  song.once('load', function() {
    songLoaded = true;
  });
  document.getElementById("albumart").src = albumArtFile;
  document.getElementById("artistName").textContent = prodName;
  document.getElementById("songName").innerHTML = displayName;
});

jQuery.get(`/otherFiles/patternData/${varSongName}/${varMode}/${varDifficulty}.txt`, function(data) {
  data = data.split('}');
  var lastTempo;
  for(var i = 0; i < data.length; i++) {
    if(data[i].indexOf('comment') !== -1) {
      //do nothing
    } else if(data[i].indexOf('click') !== -1) {
      str = data[i].split('{');
      str = str[1].split(';');
      var loc = str[1];
      str = str[0].split('/');
      //now str[0] is tempo, str[1] is beat

    } else if(data[i].indexOf('bg') !== -1) {
      str = data[i].split('{');
      str = str[1].split(' to ');
      document.getElementById("gameScreen").style.background = `radial-gradient(circle, ${str[0]} 0%, ${str[1]} 100%)`;
    } else if(data[i].indexOf('bpm') !== -1) {
      str = data[i].split('{');
      str = str[1].split(';');
      var length = bpmData.length;
      bpmData[length] = [];
      bpmData[length][0] = str[0];
      bpmData[length][1] = str[1];
    } else if(data[i].indexOf('tempo') !== -1) {
      str = data[i].split('{');
      tempoPerBeat = str[1];
    } else if(data[i].indexOf('length') !== -1) {
      str = data[i].split('{');
      totalBeat = str[1];
    }
  }
  bpm = bpmData[0][1];
  updateTime = 60 / bpm * 1000;
  document.getElementById("noteArea").style.transitionDuration = (updateTime / 1000) + 's';
  var leftMargin;
  var rightMargin;
  if(bpmData.length == 1) {
    leftMargin = (window.innerWidth / 10 * (bpm / 60)) * speed;
    totalBeat = Math.floor((totalBeat / (60 / bpmData[0][1])) / tempoPerBeat);
    document.getElementById("noteArea").innerHTML = '<div class="tempo"></div>';
    document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-left: ${leftMargin - 3.5 + 'px'}"></div>`;
    document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-left: ${leftMargin - 2 + 'px'}"></div>`;
    document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-left: ${leftMargin - 2 + 'px'}"></div>`;
    for(var i = 0; i < totalBeat; i++) {
      document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="tempo" style="margin-left: ${leftMargin - 4 + 'px'}"></div>`;
      document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-left: ${leftMargin - 3.5 + 'px'}"></div>`;
      document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-left: ${leftMargin - 2 + 'px'}"></div>`;
      document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-left: ${leftMargin - 2 + 'px'}"></div>`;
    }
  } else {
    var nbr;
    var beatCount = 1;
    for(var i = 0; i < bpmData.length; i++) {
      console.log(`i loop ${i}`);
      rightMargin = (window.innerWidth / 10 * (bpmData[i][1] / 60)) * speed;
      console.log(rightMargin);
      nbr = bpmData[i][0];
      nbr = nbr.split('/');
      if(i + 1 >= bpmData.length) {
        //nbr = Math.round((totalBeat / (60 / bpmData[i][1])) - (Number(nbr[0]) * tempoPerBeat + Number(nbr[1]) - 1));
        nbr = totalBeat - (nbr[0] * nbr[1]);
        console.log(nbr);
      } else {
        var snbr = bpmData[i + 1][0];
        snbr = snbr.split('/');
        //nbr = Math.round((Number(snbr[0]) * tempoPerBeat + Number(snbr[1]) - 1) / (60 / bpmData[i][1]));
        nbr = (snbr[0] * snbr[1] * tempoPerBeat) - (nbr[0] * snbr[1] * tempoPerBeat);
        console.log(nbr);
      }
      for(var j = 0; j < nbr; j++) {
        if(beatCount >= Number(tempoPerBeat) + 1) {
          beatCount = 1;
        }
        console.log(`j loop ${j}, ${beatCount}`);
        if(beatCount == 1) {
          document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="tempo" style="margin-right: ${rightMargin - 4 + 'px'}"></div>`;
          beatCount++;
        } else if(beatCount == 4) {
          document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-right: ${rightMargin - 3.5 + 'px'}"></div>`;
          beatCount++;
        } else {
          document.getElementById("noteArea").innerHTML = document.getElementById("noteArea").innerHTML + `<div class="beat" style="margin-right: ${rightMargin - 2 + 'px'}"></div>`;
          beatCount++;
        }
      }
    }
  }
  checkLoaded();
});

function updateNote() {
  console.log("NoteUpdating");
  if(isStop == false) {
    //noteLoc = noteLoc - (((window.innerWidth / 100 * 95) / 10 * (bpm / 100)) * speed);
    noteLoc = noteLoc - ((window.innerWidth / 10 * (bpm / 60)) * speed);
    document.getElementById("noteArea").style.transform = `translateX(${noteLoc}px)`;
  }
  setTimeout(updateNote, updateTime);
}

function checkLoaded() {
  if(isFadeOuted && songLoaded) {
    updateNote();
    //var songSyncTime = ((window.innerWidth / (((window.innerWidth / 100 * 95) / 10 * (bpm / 100)) * speed)) * updateTime) + sync;
    var songSyncTime = ((window.innerWidth / ((window.innerWidth / 10 * (bpm / 60)) * speed)) * updateTime) + sync;
    setTimeout(function() {
      song.play();
    }, songSyncTime);
  } else {
    setTimeout(checkLoaded, 500);
  }
}

paceOptions = {
  elements: true,
  restartOnRequestAfter: false
};

Pace.on('done', function() {
  if(loadFinished == true) {
    $("#loading").fadeOut(1000, function() { isFadeOuted = true; });
  } else {
    loadFinished = true;
  }
});

Howler.volume(0.4);
