var selection = 0;
var selectionList = ['menuMain', 'menuEditor', 'menuAdvanced'];
var display = 0;

var songs = new Howl({
  src: [`${cdnUrl}/songs/192kbps/MyRhyThemeSong.mp3`],
  autoplay: true,
  loop: true,
  onend: function() {}
});

window.onload = function() {
  $.ajax({
    type: 'GET',
    url: `${api}/getSettings`,
    dataType: 'JSON',
    xhrFields: {
        withCredentials: true
    },
    success: function(data){
      console.log(data);
        if(data.result == "loaded") {
            settings = data.settings;
            minit();
        } else if(data.result == "failed") {
            alert('An error occured.');
        }
    }
  });
}

function minit() {
  Howler.volume = settings.sound.musicVolume / 100;
}

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