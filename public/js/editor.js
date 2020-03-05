const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
};

$(document).ready(() => {
  $.ajax({
    type: 'GET',
    url: `${api}/getStatus`,
    dataType: 'JSON',
    xhrFields: {
      withCredentials: true
    },
    success: (data => {
      if(data.status == "Not logined") {
        window.location.href = `${url}`;
      } else if(data.status == "Not authorized") {
        window.location.href = `${url}/authorize`;
      } else if(data.status == "Not registered") {
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