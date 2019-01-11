var firstColor, secondColor;

jQuery.get('/otherFiles/patternData/ProtoType/SongData.txt', function(data) {
  var str = data.split('backgroundColor: ');
  var str = str[1].split('-to-');
  firstColor = str[0];
  var str = str[1].split(';');
  secondColor = str[0];
  document.body.style.background = "radial-gradient(circle, " + firstColor + " 0%, " + secondColor + " 100%)";
});

jQuery.get('/otherFiles/patternData/ProtoType/1.txt', function(data) {

});

Pace.on('done', function() {

});
