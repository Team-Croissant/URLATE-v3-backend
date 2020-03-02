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
          complete: (res) => {
            res = res.responseJSON;
            settings = JSON.parse(res.settings);
            settingApply();
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