var selection = 0;
var selectionList = ['menuMain', 'menuEditor', 'menuAdvanced'];
var display = 0;
var username = '';
var analyser, dataArray;

var songs = new Howl({
  src: [`${cdnUrl}/songs/192kbps/MyRhyThemeSong.mp3`],
  autoplay: true,
  loop: true,
  onend: () => {}
});

function settingApply() {
  Howler.volume(settings.sound.musicVolume / 100);
}

function drawBar(x1, y1, x2, y2, width, frequency) {
  frequency = frequency / 1.5 + 85;
  if(frequency > 180) {
    frequency = 180;
  } else if(frequency < 150) {
    frequency = 150;
  }
  lineColor = `rgb(${frequency}, ${frequency}, ${frequency})`;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
}

function animationLooper() {
  bars = 100;
  barWidth = window.innerHeight / bars;

  // set to the size of device
  canvas = document.getElementById("renderer");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");
  
  analyser.getByteFrequencyData(dataArray);
  for(var i = 0; i < bars; i++){
    barHeight = dataArray[i] * window.innerHeight / 700;
    y = barWidth * i;
    x = 0;
    x_end = barHeight / 1.3;
    drawBar(x, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  for(var i = 0; i < bars; i++){
    barHeight = dataArray[i] * window.innerHeight / 700;
    y = window.innerHeight - barWidth * i;
    x = window.innerWidth;
    x_end = window.innerWidth - (barHeight / 1.3);
    drawBar(x, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  window.requestAnimationFrame(animationLooper);
}

window.onload = () => {
  analyser = Howler.ctx.createAnalyser();
  Howler.masterGain.connect(analyser);
  analyser.connect(Howler.ctx.destination);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  animationLooper();
  $.ajax({
    type: 'GET',
    url: `${api}/vaildCheck`,
    dataType: 'JSON',
    xhrFields: {
      withCredentials: true
    },
    success: (data => {
      if(data.result == "Not logined") {
        window.location.href = `${projectUrl}`;
      } else if(data.result == "Not authorized") {
        window.location.href = `${projectUrl}/authorize`;
      } else if(data.result == "Not registered") {
        window.location.href = `${projectUrl}/join`;
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
            username = res.nickname;
            $("#name").text(username);
            settingApply();
          },
          error: (err) => {
            alert(`Error ocurred.\n${err}`);
            window.location.href = `${projectUrl}`;
          }
        });
      }
    })
  });
};

Pace.on('done', () => {
  if($("#name").width() > 300) {
    $("#name").css("font-size", "1.7vh");
  } else if($("#name").width() > 200) {
    $("#name").css("font-size", "2vh");
  } else if($("#name").width() > 180) {
    $("#name").css("font-size", "2.5vh");
  }
  $('#loadingContainer').fadeOut(1000, () => {
    $("#myrhyText").css("font-size", "1em");
    $("#myrhyText").css("margin-bottom", "0vh");
    $("#songName").css("font-size", "1.8em");
    $("#header").animate({
      opacity: 1
    }, 1000, () => {
      $("#songName").animate({
        opacity: 1
      }, 1000);
    });
    $("#footerLeft").animate({
      opacity: 1
    }, 1000);
  });
});

function menuLeft() {
  $(`#${selectionList[selection]}`).css("display", "none");
  selection--;
  if(selection < 0) {
    selection = selectionList.length - 1;
  }
  $(`#${selectionList[selection]}`).css("display", "flex");
}

function menuRight() {
  $(`#${selectionList[selection]}`).css("display", "none");
  selection++;
  if(selection > selectionList.length - 1) {
    selection = 0;
  }
  $(`#${selectionList[selection]}`).css("display", "flex");
}

function infoScreen() {
  display = 4;
  infoInit();
  $("#infoContainer").css("display", "block");
  $("#infoContainer").animate({
    opacity: 1
  }, 1000);
}

function displayClose() {
  if(display == 1) {
    //PLAY
  } else if(display == 2) {
    //Settings
  } else if(display == 3) {
    //ADVANCED
    $("#advancedContainer").animate({
      opacity: 0
    }, 1000, () => {
      advancedInit();
    });
  } else if(display == 4) {
    //Info
    $("#infoContainer").animate({
      opacity: 0
    }, 1000, () => {
      infoInit();
    });
  }
  display = 0;
}

function advancedInit() {
  $("#advancedContainer").css("display", "none");
  $("#advancedContainer").css("opacity", 0);
  $("#advancedIcon").css("marginTop", "10vh");
  $("#advancedIcon").css("opacity", 0);
  $("#advancedDescription").css("opacity", 0);
  $("#advancedSupport").css("opacity", 0);
  $("#supportDetails").css("opacity", 0);
  $("#advancedDetails").css("opacity", 0);
  $("#tableContainer").css("opacity", 0);
  for (var i = 0; i < document.getElementsByClassName('advancedDetails').length; i++) {
    $(".advancedDetails").eq(i).css("opacity", 0);
  }
}

function infoInit() {
  $("#infoContainer").css("display", "none");
}

function menuSelected() {
  if(selection == 0) {
    //play
  } else if(selection == 1) {
    //editor
    window.location.href = `${url}/editor`;
  } else if(selection == 2) {
    //advanced
    advancedInit();
    display = 3;
    var eqn = 0;
    $("#advancedContainer").css("display", "block");
    $("#advancedContainer").animate({
      opacity: 1
    }, 1000, () => {
      $("#advancedIcon").animate({
        marginTop: "5vh",
        opacity: 1
      }, 1000, () => {
        $("#advancedDescription").animate({
          opacity: 1
        }, 500, () => {
          $("#advancedSupport").animate({
            opacity: 1
          }, 200, () => {
            $("#supportDetails").animate({
              opacity: 1
            }, 200, () => {
              $("#advancedDetails").animate({
                opacity: 1
              }, 200, () => {
                $("#tableContainer").animate({
                  opacity: 1
                }, 200, () => {
                  for (var i = 0; i < document.getElementsByClassName('advancedDetails').length; i++) {
                    setTimeout(() => {
                      $(".advancedDetails").eq(eqn).animate({
                        opacity: 1
                      }, 200);
                      eqn++;
                      if(eqn > document.getElementsByClassName('advancedDetails').length) {
                        eqn = 0;
                      }
                    }, 200 * i);
                  }
                });
              });
            });
          });
        });
      });
    });
  }
}