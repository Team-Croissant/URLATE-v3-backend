let track, difficulty, version, beat, bpm, speed, player, patterns;

let getParam = (sname) => {
  let params = location.search.substr(location.search.indexOf("?") + 1);
  let sval = "";
  params = params.split("&");
  for (let i = 0; i < params.length; i++) {
      temp = params[i].split("=");
      if ([temp[0]] == sname) { sval = temp[1]; }
  }
  return sval;
}

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
};

const sortArray = (a, b) => {
  if(a.tempo == b.tempo) {
    return 0
  }
  return a.tempo > b.tempo ? 1 : -1;
}

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
            settingApply();
            track = getParam("track");
            difficulty = getParam("difficulty");
            if(!track || !difficulty) {
              window.location.href = `${url}/game`;
            }
            player = new Howl({
              src: [`${cdnUrl}/tracks/${settings.sound.quality}/${track}.mp3`],
              autoplay: false,
              loop: false,
              onend: result()
            });
            username = res.nickname;
            $.getJSON(`/patterns/${track}/${difficulty}.json`, function(pattern) {
              version = pattern.information.version;
              beat = pattern.information.beat;
              bpm = pattern.information.bpm;
              speed = pattern.information.speed;
              patterns = pattern.sort(sortArray);
            }).fail(() => {
              alert("Invaild data error");
              window.location.href = `${url}/game`;
            });
          },
          error: (err) => {
            alert(`Error ocurred.\n${err}`);
            window.location.href = `${url}`;
          }
        });
      }
    })
  });
});

Pace.on('done', () => {
  
});

const result = () => {
  //show result
}