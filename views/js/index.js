window.onload = function() {
    document.getElementById('buttonContainer').style.transitionDuration = '2s';
    setTimeout(function() {
        document.getElementById('buttonContainer').style.marginTop = '2vh';
        document.getElementById('buttonContainer').style.opacity = '1';
    }, 500);
 };

 function onSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();
    const id_token = googleUser.getAuthResponse().id_token;
    console.log(id_token);
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  }
  