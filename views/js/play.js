var loadFinished = false;
var isFadeOuted = false;

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
var patternData;
var song;
var songPath = [];

jQuery.get('/otherFiles/songs.txt', function(data) {
  var str = data.split(';');
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
  song.once('load', checkLoaded);
  document.getElementById("albumart").src = albumArtFile;
  document.getElementById("artistName").textContent = prodName;
  document.getElementById("songName").innerHTML = displayName;
});

jQuery.get(`/otherFiles/patternData/${varSongName}/${varMode}/${varDifficulty}.txt`, function(data) {
  patternData = data;
});

function checkLoaded() {
  console.log('isLoaded?');
  if(isFadeOuted) {
    console.log("oh It's loaded!");
    setTimeout(function() {
      console.log("Song playing now");
      song.play();
    }, 3000);
  } else {
    console.log("oh It's not loaded..");
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
