document.addEventListener("DOMContentLoaded", async () => {
  await fetch(`${api}/auth/status`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status == "Logined") {
        window.location.href = `${url}/game`;
      } else if (data.status == "Not authorized") {
        window.location.href = `${url}/authorize`;
      } else if (data.status == "Not registered") {
        window.location.href = `${url}/join`;
      }
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
    });
  fetch(`${api}/danal/ready`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      let form = document.createElement("form");
      form.method = "POST";
      form.action = "https://wauth.teledit.com/Danal/WebAuth/Web/Start.php";
      form.innerHTML = `<input name="TID" value="${data.TID}">`;
      form.innerHTML += `<input name="BackURL" value="${url}/authentication/failed">`;
      form.innerHTML += `<input name="IsCharSet" value="UTF-8">`;
      document.body.append(form);
      form.submit();
    })
    .catch((error) => {
      alert(`Error occured.\n${error}`);
    });
});
