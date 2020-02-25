let selection = 0;
let selectionList = ['menuMain', 'menuEditor', 'menuAdvanced'];
let display = 0;
let username = '';
let analyser, dataArray;

//volume need to 0.1~0.8
const songs = new Howl({
  src: [`${cdnUrl}/tracks/192kbps/MyRhy Theme.mp3`],
  autoplay: true,
  loop: true,
  onend: () => {}
});

const settingApply = () => {
  Howler.volume(settings.sound.musicVolume / 100);
};

const drawBar = (x1, y1, x2, y2, width, frequency) => {
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
};

let milis = 0;
let isBoom = false;
const animationLooper = () => {
  bars = 100;
  barWidth = window.innerHeight / bars;
  canvas = document.getElementById("renderer");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");  
  analyser.getByteFrequencyData(dataArray);
  dataLimit = 130 + Howler.volume() * 110;
  d = new Date();
  if(dataArray[1] > dataLimit && d.getTime() - milis > 100 && isBoom == false) {
    milis = d.getTime();
    $('#visualizer').toggleClass('boom');
    isBoom = true;
  } else if(dataArray[1] < dataLimit && d.getTime() - milis && isBoom == true) {
    milis = d.getTime();
    $('#visualizer').toggleClass('boom');
    isBoom = false;
  }
  for(let i = 0; i < bars; i++){
    barHeight = dataArray[i] * window.innerHeight / 500;
    y = barWidth * i;
    x = 0;
    x_end = barHeight / 1.3;
    drawBar(x, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  for(let i = 0; i < bars; i++){
    barHeight = dataArray[i] * window.innerHeight / 500;
    y = window.innerHeight - barWidth * i;
    x = window.innerWidth;
    x_end = window.innerWidth - (barHeight / 1.3);
    drawBar(x, y, x_end, y, barWidth - (barWidth / 2), dataArray[i]);
  }
  window.requestAnimationFrame(animationLooper);
};

$(document).ready(() => {
  $.ajax({
    type: 'GET',
    url: `${api}/vaildCheck`,
    dataType: 'JSON',
    xhrFields: {
      withCredentials: true
    },
    complete: (data => {
      if(data.responseJSON.result == "Not logined") {
        window.location.href = `${url}`;
      } else if(data.responseJSON.result == "Not authorized") {
        window.location.href = `${url}/authorize`;
      } else if(data.responseJSON.result == "Not registered") {
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
            settings = JSON.parse(res.responseJSON.settings);
            username = res.responseJSON.nickname;
            $("#name").text(username);
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

window.onload = () => {
  analyser = Howler.ctx.createAnalyser();
  Howler.masterGain.connect(analyser);
  analyser.connect(Howler.ctx.destination);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  animationLooper();
};

Pace.on('done', () => {
  if($("#name").width() > 300) {
    $("#name").css("font-size", "1.7vh");
  } else if($("#name").width() > 200) {
    $("#name").css("font-size", "2vh");
  } else if($("#name").width() > 180) {
    $("#name").css("font-size", "2.5vh");
  }
  $("#menuContainer").css("display", "flex");
  $("#loadingContainer").fadeOut(500, () => {
    $("#menuContainer").toggleClass("loaded");
    $("#myrhyText").css("font-size", "1em");
    $("#myrhyText").css("margin-bottom", "0vh");
    $("#songName").css("font-size", "1.8em");
    $("#header").animate({
      opacity: 1
    }, 500, () => {
      $(".backIcon").animate({
        opacity: 0.3
      }, 500);
      $("#songName").animate({
        opacity: 1
      }, 1000);
    });
    $("#footerLeft").animate({
      opacity: 1
    }, 1000);
  });
});

const menuLeft = () => {
  $(`#${selectionList[selection]}`).css("display", "none");
  selection--;
  if(selection < 0) {
    selection = selectionList.length - 1;
  }
  $(`#${selectionList[selection]}`).css("display", "flex");
};

const menuRight = () => {
  $(`#${selectionList[selection]}`).css("display", "none");
  selection++;
  if(selection > selectionList.length - 1) {
    selection = 0;
  }
  $(`#${selectionList[selection]}`).css("display", "flex");
};

const infoScreen = () => {
  display = 4;
  infoInit();
  $("#infoContainer").css("display", "block");
  $("#infoContainer").animate({
    opacity: 1
  }, 1000);
};

const displayClose = () => {
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
};

const advancedInit = () => {
  $("#advancedContainer").css("display", "none");
  $("#advancedContainer").css("opacity", 0);
  $("#advancedIcon").css("marginTop", "10vh");
  $("#advancedIcon").css("opacity", 0);
  $("#advancedDescription").css("opacity", 0);
  $("#advancedSupport").css("opacity", 0);
  $("#supportDetails").css("opacity", 0);
  $("#advancedDetails").css("opacity", 0);
  $("#tableContainer").css("opacity", 0);
  for (let i = 0; i < document.getElementsByClassName('advancedDetails').length; i++) {
    $(".advancedDetails").eq(i).css("opacity", 0);
  }
};

const infoInit = () => {
  $("#infoContainer").css("display", "none");
};

const menuSelected = () => {
  if(selection == 0) {
    //play
    //prototype code
    window.location.href = `${url}/proto?track=Chatty%20Bones%202018&difficulty=1`;
  } else if(selection == 1) {
    //editor
    window.location.href = `${url}/editor`;
  } else if(selection == 2) {
    //advanced
    advancedInit();
    display = 3;
    let eqn = 0;
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
                  for (let i = 0; i < document.getElementsByClassName('advancedDetails').length; i++) {
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
};