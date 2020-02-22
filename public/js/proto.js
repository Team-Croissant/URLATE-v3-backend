let track, difficulty, version, beat, bpm, speed, player;

let getParam = (sname) => {
  var params = location.search.substr(location.search.indexOf("?") + 1);
  var sval = "";
  params = params.split("&");
  for (var i = 0; i < params.length; i++) {
      temp = params[i].split("=");
      if ([temp[0]] == sname) { sval = temp[1]; }
  }
  return sval;
}

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
};

$(document).ready(() => {
  $.ajax({
    type: 'GET',
    url: `${api}/vaildCheck`,
    dataType: 'JSON',
    xhrFields: {
      withCredentials: true
    },
    success: (data => {
      if(data.result == "Not logined") {
        window.location.href = `${url}`;
      } else if(data.result == "Not authorized") {
        window.location.href = `${url}/authorize`;
      } else if(data.result == "Not registered") {
        window.location.href = `${url}/join`;
      } else {
        $.ajax({
          type: 'GET',
          url: `${api}/getUser`,
          dataType: 'JSON',
          xhrFields: {
            withCredentials: true
          },
          success: (res) => {
            settings = JSON.parse(res.settings);
            player = new Howl({
              src: [`${cdnUrl}/tracks/${settings.sound.quality}/${getParam("track")}.mp3`],
              autoplay: false,
              loop: false,
              onend: result()
            });
            username = res.nickname;
            settingApply();
            if(!getParam("track") || !getParam("difficulty")) {
              window.location.href = `${url}/game`;
            }
          },
          error: (err) => {
            alert(`Error ocurred.\n${err}`);
            window.location.href = `${projectUrl}`;
          }
        });
      }
    })
  });
});

Pace.on('done', () => {
  track = getParam("track");
  difficulty = getParam("difficulty");
  $.getJSON(`/patterns/${track}/${difficulty}.json`, function(json) {
    console.log(json);
    version = json.information.version;
    beat = json.information.beat;
    bpm = json.information.bpm;
    speed = json.information.speed;
  }).fail(() => {
    alert("Invaild data error");
    window.location.href = `${url}/game`;
  });
});

const result = () => {
  //show result
}