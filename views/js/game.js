//var songConfig = $.getJSON("others/songs.json");

Howler.volume(0.5);

var songs = new Howl({
  src: ['https://cdn.rhyga.me/songs/192kbps/MyRhyThemeSong.mp3'],
  autoplay: true,
  loop: true,
  volume: 0.5,
  onend: function() {
  }
});

Pace.on('done', () => {
    $('#loadingContainer').fadeOut(1000, () => {
      $("#footerLeft").animate({
        opacity: 100
      });
    });
});