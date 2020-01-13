window.onload = function() {
  document.getElementById('buttonContainer').style.transitionDuration = '2s';
  setTimeout(function() {
    document.getElementsByClassName('abcRioButtonContents')[0].getElementsByTagName("span")[1].innerHTML = document.getElementsByClassName('abcRioButtonContents')[0].getElementsByTagName("span")[0].innerHTML;
    document.getElementById('buttonContainer').style.marginTop = '2vh';
    document.getElementById('buttonContainer').style.opacity = '1';
  }, 500);
};

 $('#my-signin2').click(function() {
  auth2.grantOfflineAccess().then(signInCallback);
});

function signInCallback(authResult) {
  if (authResult['code']) {
    console.log(authResult['code']);
    $.ajax({
      type: 'POST',
      url: `${projectUrl}/login`,
      dataType: 'JSON',
      data: { "code" : authResult['code'] },
      success: function(data){
        if(data.msg == "success") {
          window.location.href = `${projectUrl}/game`;
        } else if(data.msg == "fail") {
          alert("구글 로그인에 실패했습니다. 다시 시도해주세요.");
        }
      }
    });
  } else {
    alert('로그인 과정에서 에러가 발생했습니다.\n다시 시도해주세요.');
  }
}
  

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
}