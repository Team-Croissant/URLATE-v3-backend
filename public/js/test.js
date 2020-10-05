const canvas = document.getElementById('componentCanvas');
const ctx = canvas.getContext("2d");
const missCanvas = document.getElementById('missPointCanvas');
const missCtx = missCanvas.getContext("2d");
let pattern = {};
let userName = '';
let settings, sync, song, tracks, pixelRatio, offset, bpm, speed;
let pointingCntElement = [{"v1": '', "v2": '', "i": ''}];
let circleBulletAngles = [];
let destroyParticles = [];
let missParticles = [];
let destroyedBullets = new Set([]);
let destroyedNotes = new Set([]);
let mouseX = 0, mouseY = 0;
let score = 0, combo = 0, displayScore = 0, maxCombo = 0;
let perfect = 0;
let great = 0;
let good = 0;
let bad = 0;
let miss = 0;
let bullet = 0; //miss와 bullet을 따로 처리
let mouseClicked = false;
let menuAllowed = false;
let mouseClickedMs = -1;
let frameCounterMs = Date.now();
let isMenuOpened = false;
let isResultShowing = false;
let frameArray = [];
let fps = 0;
let missPoint = [];
let sens = 1, denySkin = false, skin, cursorZoom, inputMode;
let comboAlert = false, comboCount = 50;
let comboAlertMs = 0, comboAlertCount = 0;
let hide = {}, frameCounter;
let tick = new Howl({
  src: [`/sounds/tick.mp3`],
  autoplay: false,
  loop: false
});
let resultEffect = new Howl({
  src: [`${cdn}/tracks/result.mp3`],
  autoplay: false,
  loop: false
});

document.addEventListener("DOMContentLoaded", () => {
  menuContainer.style.display = 'none';
  fetch(`${api}/getTracks`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.result == 'success') {
      tracks = data.tracks;
    } else {
      alert('Failed to load song list.');
      console.error('Failed to load song list.');
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
  fetch(`${api}/getStatus`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.status == "Not authorized") {
      window.location.href = `${url}/authorize`;
    } else if(data.status == "Not registered") {
      window.location.href = `${url}/join`;
    } else if(data.status == "Not logined") {
      window.location.href = url;
    } else {
      fetch(`${api}/getUser`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => res.json())
      .then((data) => {
        if(data.result == 'success') {
          userName = data.nickname;
          settings = JSON.parse(data.settings);
          initialize(true);
          if(data.advanced) {
            urlate.innerHTML = '<strong>URLATE</strong> Advanced';
          }
          settingApply();
        } else {
          alert(`Error occured.\n${data.description}`);
          console.error(`Error occured.\n${data.description}`);
        }
      }).catch((error) => {
        alert(`Error occured.\n${error}`);
        console.error(`Error occured.\n${error}`);
      });
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
});

const initialize = (isFirstCalled) => {
  if(isFirstCalled) {
    pattern = JSON.parse(localStorage.pattern);
    document.getElementById('title').textContent = pattern.information.track;
    document.getElementById('scoreTitle').textContent = pattern.information.track;
    document.getElementById('artist').textContent = pattern.information.producer;
    document.getElementById('scoreArtist').textContent = pattern.information.producer;
    document.getElementById('authorNamespace').textContent = pattern.information.author;
    offset = pattern.information.offset;
    bpm = pattern.information.bpm;
    speed = pattern.information.speed;
  }
  canvas.width = window.innerWidth * pixelRatio * settings.display.canvasRes / 100;
  canvas.height = window.innerHeight * pixelRatio * settings.display.canvasRes / 100;
  missCanvas.width = window.innerWidth * 0.2 * pixelRatio;
  missCanvas.height = window.innerHeight * 0.05 * pixelRatio;
};

const settingApply = () => {
  tick.volume(settings.sound.volume.master * settings.sound.volume.hitSound);
  resultEffect.volume(settings.sound.volume.master * settings.sound.volume.effect);
  sync = parseInt(settings.sound.offset);
  document.getElementById('loadingContainer').style.opacity = 1;
  sens = settings.input.sens;
  denySkin = settings.editor.denyAtTest;
  cursorZoom = settings.game.size;
  inputMode = settings.input.keys;
  comboAlert = settings.game.comboAlert;
  comboCount = settings.game.comboCount;
  hide.perfect = settings.game.applyJudge.Perfect;
  hide.great = settings.game.applyJudge.Great;
  hide.good = settings.game.applyJudge.Good;
  hide.bad = settings.game.applyJudge.Bad;
  hide.miss = settings.game.applyJudge.Miss;
  frameCounter = settings.game.counter;
  let fileName = '';
  for(let i = 0; i < tracks.length; i++) {
    if(tracks[i].name == pattern.information.track) {
      fileName = tracks[i].fileName;
      document.getElementById("album").src = `${cdn}/albums/${settings.display.albumRes}/${fileName} (Custom).png`;
      document.getElementById('canvasBackgroundImage').style.backgroundImage = `url("${cdn}/albums/${settings.display.albumRes}/${fileName} (Custom).png")`;
      document.getElementById('scoreBackground').style.backgroundImage = `url("${cdn}/albums/${settings.display.albumRes}/${fileName} (Custom).png")`;
      document.getElementById('scoreAlbum').style.backgroundImage = `url("${cdn}/albums/${settings.display.albumRes}/${fileName} (Custom).png")`;
      break;
    }
  }
  fetch(`${api}/getSkin/${settings.game.skin}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.result == 'success') {
      skin = JSON.parse(data.data);
    } else {
      alert(`Error occured.\n${data.description}`);
      console.error(`Error occured.\n${data.description}`);
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
    console.error(`Error occured.\n${error}`);
  });
  fetch(`${api}/getTracks`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then((data) => {
    if(data.result == 'success') {
      song = new Howl({
        src: [`${cdn}/tracks/${settings.sound.res}/${fileName}.mp3`],
        autoplay: false,
        loop: false,
        onend: () => {
          isResultShowing = true;
          menuAllowed = false;
          calculateResult();
        },
        onload: () => {
        }
      });
      song.volume(settings.sound.volume.master * settings.sound.volume.music);
    } else {
      alert('Failed to load song list.');
    }
  }).catch((error) => {
    alert(`Error occured.\n${error}`);
  });
};

const eraseCnt = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const getJudgeStyle = (j, p, x, y) => {
  p = `${parseInt(p)}`.padStart(2, '0');
  if(p <= 0) p = 0;
  if(denySkin) {
    if(j == 'miss') {
      return `rgba(237, 78, 50, ${1 - p / 100})`;
    } else if(j == 'perfect') {
      let grd = ctx.createLinearGradient(x - 50, y - 20, x + 50, y + 20);
      grd.addColorStop(0, `rgba(87, 209, 71, ${1 - p / 100})`);
      grd.addColorStop(1, `rgba(67, 167, 224, ${1 - p / 100})`);
      return grd;
    } else if(j == 'great') {
      return `rgba(87, 209, 71, ${1 - p / 100})`;
    } else if(j == 'good') {
      return `rgba(67, 167, 224, ${1 - p / 100})`;
    } else if(j == 'bad') {
      return `rgba(176, 103, 90, ${1 - p / 100})`;
    } else {
      return `rgba(50, 50, 50, ${1 - p / 100})`;
    }
  } else {
    p = parseInt(255 - p * 2.55).toString(16).padStart(2, '0');
    if(p <= 0) p = '00';
    if(skin[j].type == 'gradient') {
      let grd = ctx.createLinearGradient(x - 50, y - 20, x + 50, y + 20);
      for(let i = 0; i < skin[j].stops.length; i++) {
        grd.addColorStop(skin[j].stops[i].percentage / 100, `#${skin[j].stops[i].color}${p.toString(16)}`);
      }
      return grd;
    } else if(skin[j].type == 'color') {
      return `#${skin[j].color}${p.toString(16)}`;
    }
  }
};

const drawParticle = (n, x, y, j) => {
  let cx = canvas.width / 200 * (x + 100);
  let cy = canvas.height / 200 * (y + 100);
  if(n == 0) { //Destroy
    const raf = (n, w) => {
      for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.fillStyle = '#222';
        ctx.arc(cx + (n * destroyParticles[j].d[i][0]), cy + (n * destroyParticles[j].d[i][1]), w, 0, 2 * Math.PI);
        ctx.fill();
      }
    };
    raf(destroyParticles[j].n, destroyParticles[j].w);
  } else if(n == 1) { //Click Note
    const raf = (w, s) => {
      ctx.beginPath();
      let width = canvas.width / 50;
      let p = 100 - ((s + 500 - Date.now()) / 5);
      let grd = ctx.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
      grd.addColorStop(0, `rgba(251, 73, 52, ${0.5 - p / 200})`);
      grd.addColorStop(1, `rgba(235, 217, 52, ${0.5 - p / 200})`);
      ctx.strokeStyle = grd;
      ctx.arc(cx, cy, w, 0, 2 * Math.PI);
      ctx.stroke();
      w = canvas.width / 70 + canvas.width / 400 + width * (p / 100);
      if(p < 100) {
        requestAnimationFrame(() => {
          raf(w, s);
        });
      }
    };
    raf(canvas.width / 70 + canvas.width / 400, Date.now());
  } else if(n == 2) { //Click Default
    const raf = (w, s) => {
      ctx.beginPath();
      let width = canvas.width / 60;
      let p = 100 - ((s + 300 - Date.now()) / 3);
      let grd = ctx.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
      grd.addColorStop(0, `rgba(174, 102, 237, ${0.2 - p / 500})`);
      grd.addColorStop(1, `rgba(102, 183, 237, ${0.2 - p / 500})`);
      ctx.strokeStyle = grd;
      ctx.arc(cx, cy, w, 0, 2 * Math.PI);
      ctx.stroke();
      w = canvas.width / 70 + canvas.width / 400 + width * (p / 100);
      if(p < 100) {
        requestAnimationFrame(() => {
          raf(w, s);
        });
      }
    };
    raf(canvas.width / 70 + canvas.width / 400, Date.now());
  } else if(n == 3) { //Judge
    if(!hide[j.toLowerCase()]) {
      const raf = (y, s) => {
        ctx.beginPath();
        let p = 100 - ((s + 300 - Date.now()) / 3);
        let newY = cy - Math.round(p / 10);
        ctx.fillStyle = getJudgeStyle(j.toLowerCase(), p, cx, newY);
        ctx.font = "3vh Metropolis";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(j, cx, newY);
        if(p < 100) {
          requestAnimationFrame(() => {
            raf(cy, s);
          });
        }
      };
      raf(cy, Date.now());
    }
  } else if(n == 4) { //judge:miss
    if(!hide.miss) {
      ctx.beginPath();
      let p = 100 - ((missParticles[j].s + 300 - Date.now()) / 3);
      let newY = cy - Math.round(p / 10);
      ctx.fillStyle = `rgba(237, 78, 50, ${1 - p / 100})`;
      ctx.font = "3vh Metropolis";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText('Miss', cx, newY);
    }
  }
};

const drawNote = (p, x, y) => {
  p = Math.max(p, 0);
  x = canvas.width / 200 * (x + 100);
  y = canvas.height / 200 * (y + 100);
  let w = canvas.width / 40;
  let opacity = 'FF';
  if(p > 100) {
    opacity = `${parseInt((130 - p) * 3.333)}`.padStart(2, '0');
  }
  if(opacity <= 0) opacity = '00';
  if(!denySkin) {
    if(skin.note.type == 'gradient') {
      let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
      for(let i = 0; i < skin.note.stops.length; i++) {
        grd.addColorStop(skin.note.stops[i].percentage / 100, `#${skin.note.stops[i].color}${opacity.toString(16)}`);
      }
      ctx.fillStyle = grd;
      ctx.strokeStyle = grd;
    } else if(skin.note.type == 'color') {
      ctx.fillStyle = `#${skin.note.color}${opacity.toString(16)}`;
    }
  } else {
    let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
    grd.addColorStop(0, `#fb4934${opacity}`);
    grd.addColorStop(1, `#ebd934${opacity}`);
    ctx.fillStyle = grd;
    ctx.strokeStyle = grd;
  }
  ctx.lineWidth = Math.round(canvas.width / 500);
  ctx.beginPath();
  ctx.arc(x, y, w, 0, p / 50 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, w / 100 * p, 0, 2 * Math.PI);
  ctx.fill();
};

const drawCursor = () => {
  ctx.beginPath();
  let w = canvas.width / 70 * cursorZoom;
  if(mouseClickedMs == -1) {
    mouseClickedMs = Date.now() - 100;
  }
  if(mouseClicked) {
    if(mouseClickedMs + 20 > Date.now()) {
      w = w + (canvas.width / 400 * (1 - ((mouseClickedMs + 20 - Date.now()) / 20)));
    } else {
      w = w + (canvas.width / 400 * 1);
    }
  } else {
    if(mouseClickedMs + 100 > Date.now()) {
      w = w + (canvas.width / 400 * (mouseClickedMs + 100 - Date.now()) / 100);
    }
  }
  x = canvas.width / 200 * (mouseX + 100);
  y = canvas.height / 200 * (mouseY + 100);
  if(!denySkin) {
    if(skin.cursor.type == 'gradient') {
      let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
      for(let i = 0; i < skin.cursor.stops.length; i++) {
        grd.addColorStop(skin.cursor.stops[i].percentage / 100, `#${skin.cursor.stops[i].color}`);
      }
      ctx.fillStyle = grd;
    } else if(skin.cursor.type == 'color') {
      ctx.fillStyle = `#${skin.cursor.color}`;
    }
  } else {
    let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
    grd.addColorStop(0, `rgb(174, 102, 237)`);
    grd.addColorStop(1, `rgb(102, 183, 237)`);
    ctx.fillStyle = grd;
  }
  ctx.arc(x, y, w, 0, 2 * Math.PI);
  ctx.fill();
};

const drawBullet = (n, x, y, a) => {
  x = canvas.width / 200 * (x + 100);
  y = canvas.height / 200 * (y + 100);
  let w = canvas.width / 80;
  if(!denySkin) {
    if(skin.bullet.type == 'gradient') {
      let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
      for(let i = 0; i < skin.bullet.stops.length; i++) {
        grd.addColorStop(skin.bullet.stops[i].percentage / 100, `#${skin.bullet.stops[i].color}`);
      }
      ctx.fillStyle = grd;
      ctx.strokeStyle = grd;
    } else if(skin.bullet.type == 'color') {
      ctx.fillStyle = `#${skin.bullet.color}`;
      ctx.strokeStyle = `#${skin.bullet.color}`;
    }
  } else {
    ctx.fillStyle = "#555";
    ctx.strokeStyle = "#555";
  }
  ctx.beginPath();
  switch(n) {
    case 0:
      a = Math.PI * (a / 180 + 0.5);
      ctx.arc(x, y, w, a, a + Math.PI);
      a = a - (0.5 * Math.PI);
      ctx.moveTo(x - (w * Math.sin(a)), y + (w * Math.cos(a)));
      ctx.lineTo(x + (w * 2 * Math.cos(a)), y + (w * 2 * Math.sin(a)));
      ctx.lineTo(x + (w * Math.sin(a)), y - (w * Math.cos(a)));
      ctx.fill();
      break;
    case 1:
      ctx.arc(x, y, w, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.font = "18px Metropolis";
      ctx.fillStyle = "#F55";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`drawBullet:bullet number isn't specified.`, canvas.width / 100, canvas.height / 100);
      console.error(`drawBullet:bullet number isn't specified.`);
  }
};

const callBulletDestroy = (j) => {
  const seek = song.seek() - (offset + sync) / 1000;
  const p = (seek * 1000 - pattern.bullets[j].ms) / (bpm * 40 / speed / pattern.bullets[j].speed) * 100;
  const left = pattern.bullets[j].direction == 'L';
  let x = (left ? -1 : 1) * (100 - p);
  let y = 0;
  if(pattern.bullets[j].value == 0) {
    y = pattern.bullets[j].location + p * getTan(pattern.bullets[j].angle) * (left ? 1 : -1);
  } else {
    if(!circleBulletAngles[j]) circleBulletAngles[j] = calcAngleDegrees((left ? -100 : 100) - mouseX, pattern.bullets[j].location - mouseY);
    if(left) {
      if(110 > circleBulletAngles[j] && circleBulletAngles[j] > 0) circleBulletAngles[j] = 110;
      else if(0 > circleBulletAngles[j] && circleBulletAngles[j] > -110) circleBulletAngles[j] = -110;
    } else {
      if(70 < circleBulletAngles[j] && circleBulletAngles[j] > 0) circleBulletAngles[j] = 70;
      else if(0 > circleBulletAngles[j] && circleBulletAngles[j] < -70) circleBulletAngles[j] = -70;
    }
    y = pattern.bullets[j].location + p * getTan(circleBulletAngles[j]) * (left ? 1 : -1);
  }
  let randomDirection = [];
  for(let i = 0; i < 3; i++) {
    let rx = Math.floor(Math.random() * 4) - 2;
    let ry = Math.floor(Math.random() * 4) - 2;
    randomDirection[i] = [rx, ry];
  }
  destroyParticles.push({'x': x, 'y': y, 'w': 5, 'n': 1, 'd': randomDirection});
  destroyedBullets.add(j);
};

const cntRender = () => {
  eraseCnt();
  if(window.devicePixelRatio != pixelRatio) {
    pixelRatio = window.devicePixelRatio;
    initialize(false);
  }
  try {
    if(comboAlert) {
      let comboOpacity = 0;
      let fontSize = 20;
      if(comboAlertMs + 300 > Date.now()) {
        comboOpacity = 1 - (comboAlertMs + 300 - Date.now()) / 300;
      } else if(comboAlertMs + 300 <= Date.now() && comboAlertMs + 600 > Date.now()) {
        comboOpacity = 1;
      } else if(comboAlertMs + 600 <= Date.now() && comboAlertMs + 900 > Date.now()) {
        comboOpacity = (comboAlertMs + 900 - Date.now()) / 900;
      }
      fontSize = 30 - (comboAlertMs + 900 - Date.now()) / 90;
      ctx.beginPath();
      ctx.font = `${fontSize}vh Metropolis`;
      ctx.fillStyle = `rgba(200,200,200,${comboOpacity}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(comboAlertCount, canvas.width / 2, canvas.height / 2);
    }
    pointingCntElement = [{"v1": '', "v2": '', "i": ''}];
    const seek = song.seek() - (offset + sync) / 1000;
    let start = lowerBound(pattern.triggers, seek * 1000 - 2000);
    let end = upperBound(pattern.triggers, seek * 1000 + 2); //2 for floating point miss
    const renderTriggers = pattern.triggers.slice(start, end);
    for(let i = 0; i < renderTriggers.length; i++) {
      if(renderTriggers[i].value == 0) {
        if(!destroyedBullets.has(renderTriggers[i].num)) {
          callBulletDestroy(renderTriggers[i].num);
        }
      } else if(renderTriggers[i].value == 1) {
        end = upperBound(pattern.bullets, renderTriggers[i].ms);
        const renderBullets = pattern.bullets.slice(0, end);
        for(let j = 0; renderBullets.length > j; j++) {
          if(!destroyedBullets.has(j)) {
            callBulletDestroy(j);
          }
        }
      } else if(renderTriggers[i].value == 2) {
        bpm = renderTriggers[i].bpm;
      } else if(renderTriggers[i].value == 3) {
        canvas.style.opacity = renderTriggers[i].opacity;
      } else if(renderTriggers[i].value == 4) {
        speed = renderTriggers[i].speed;
      } else if(renderTriggers[i].value == 5) {
        if(renderTriggers[i].ms - 1 <= seek * 1000 && renderTriggers[i].ms + renderTriggers[i].time > seek * 1000) {
          ctx.beginPath();
          ctx.fillStyle = "#111";
          ctx.font = `${renderTriggers[i].size} Metropolis`;
          ctx.textAlign = renderTriggers[i].align;
          ctx.textBaseline = "middle";
          ctx.fillText(renderTriggers[i].text, canvas.width / 200 * (renderTriggers[i].x + 100), canvas.height / 200 * (renderTriggers[i].y + 100));
        }
      }
    }
    for(let i = 0; i < destroyParticles.length; i++) {
      if(destroyParticles[i].w > 0) {
        drawParticle(0, destroyParticles[i].x, destroyParticles[i].y, i);
        destroyParticles[i].w -= 0.1;
        destroyParticles[i].n++;
      }
    }
    prevDestroyedBullets = new Set(destroyedBullets);
    start = lowerBound(pattern.patterns, seek * 1000 - (bpm * 4 / speed));
    end = upperBound(pattern.patterns, seek * 1000 + (bpm * 14 / speed));
    const renderNotes = pattern.patterns.slice(start, end);
    for(let i = 0; i < renderNotes.length; i++) {
      const p = ((bpm * 14 / speed) - (renderNotes[i].ms - (seek * 1000))) / (bpm * 14 / speed) * 100;
      trackMouseSelection(start + i, 0, renderNotes[i].value, renderNotes[i].x, renderNotes[i].y);
      drawNote(p, renderNotes[i].x, renderNotes[i].y);
      if(p >= 120 && !destroyedNotes.has(start + i)) {
        calculateScore('miss', start + i, true);
        missParticles.push({'x': renderNotes[i].x, 'y': renderNotes[i].y, 's': Date.now()});
        miss++;
        missPoint.push(song.seek() * 1000);
      }
    }
    for(let i = 0; i < missParticles.length; i++) {
      if(missParticles[i].s + 300 > Date.now()) {
        drawParticle(4, missParticles[i].x, missParticles[i].y, i);
      }
    }
    start = lowerBound(pattern.bullets, seek * 1000 - (bpm * 40));
    end = upperBound(pattern.bullets, seek * 1000);
    const renderBullets = pattern.bullets.slice(start, end);
    for(let i = 0; i < renderBullets.length; i++) {
      if(!destroyedBullets.has(start + i)) {
        const p = (seek * 1000 - renderBullets[i].ms) / (bpm * 40 / speed / renderBullets[i].speed) * 100;
        const left = renderBullets[i].direction == 'L';
        let x = (left ? -1 : 1) * (100 - p);
        let y = 0;
        if(renderBullets[i].value == 0) {
          y = renderBullets[i].location + p * getTan(renderBullets[i].angle) * (left ? 1 : -1);
          trackMouseSelection(start + i, 1, renderBullets[i].value, x, y);
          drawBullet(renderBullets[i].value, x, y, renderBullets[i].angle + (left ? 0 : 180));
        } else {
          if(!circleBulletAngles[start+i]) circleBulletAngles[start+i] = calcAngleDegrees((left ? -100 : 100) - mouseX, renderBullets[i].location - mouseY);
          if(left) {
            if(110 > circleBulletAngles[start+i] && circleBulletAngles[start+i] > 0) circleBulletAngles[start+i] = 110;
            else if(0 > circleBulletAngles[start+i] && circleBulletAngles[start+i] > -110) circleBulletAngles[start+i] = -110;
          } else {
            if(70 < circleBulletAngles[start+i] && circleBulletAngles[start+i] > 0) circleBulletAngles[start+i] = 70;
            else if(0 > circleBulletAngles[start+i] && circleBulletAngles[start+i] < -70) circleBulletAngles[start+i] = -70;
          }
          y = renderBullets[i].location + p * getTan(circleBulletAngles[start+i]) * (left ? 1 : -1);
          trackMouseSelection(start + i, 1, renderBullets[i].value, x, y);
          drawBullet(renderBullets[i].value, x, y, '');
        }
      }
    }
  } catch (e) {
    if(e) {
      ctx.font = "18px Metropolis";
      ctx.fillStyle = "#F55";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(e, canvas.width / 100, canvas.height / 100);
      console.error(e);
    }
  }
  if(displayScore < score) {
    displayScore += score / 60;
  }
  ctx.font = "700 4vh Metropolis";
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(numberWithCommas(`${Math.round(displayScore)}`.padStart(9, 0)), canvas.width / 2, canvas.height / 80);
  ctx.font = "2.5vh Metropolis";
  ctx.fillStyle = "#555";
  ctx.fillText(`${combo}x`, canvas.width / 2, canvas.height / 70 + canvas.height / 25);
  drawCursor();

  //fps counter
  if(frameCounter) {
    frameArray.push(1000 / (Date.now() - frameCounterMs));
    if(frameArray.length == 5) {
      fps = (frameArray[0] + frameArray[1] + frameArray[2] + frameArray[3] + frameArray[4]) / 5;
      frameArray = [];
    }
    ctx.font = "2.5vh Heebo";
    ctx.fillStyle = "#555";
    ctx.textBaseline = "bottom";
    ctx.fillText(fps.toFixed(), canvas.width / 2, canvas.height - canvas.height / 70);
    frameCounterMs = Date.now();
  }
  drawCursor();
  requestAnimationFrame(cntRender);
};

const trackMousePos = () => {
  let x = event.clientX / canvasContainer.offsetWidth * 200 - 100;
  let y = event.clientY / canvasContainer.offsetHeight * 200 - 100;
  mouseX = (x * sens >= 100) ? 100 : (x * sens <= -100) ? -100 : x * sens;
  mouseY = (y * sens >= 100) ? 100 : (y * sens <= -100) ? -100 : y * sens;
};

const calculateResult = () => {
  resultEffect.play();
  perfectResult.textContent = perfect;
  greatResult.textContent = great;
  goodResult.textContent = good;
  badResult.textContent = bad;
  missResult.textContent = miss;
  bulletResult.textContent = bullet;
  scoreText.textContent = numberWithCommas(`${score}`);
  comboText.textContent = `${maxCombo}x`;
  let accuracy = ((perfect + great / 10 * 7 + good / 2 + bad / 10 * 3) / (perfect + great + good + bad + miss + bullet) * 100).toFixed(1);
  accuracyText.textContent = `${accuracy}%`;
  let rank = '';
  if(accuracy >= 98 || (bad == 0 && miss == 0 && bullet == 0)) {
    rankImg.style.animationName = 'rainbow';
    rank = 'SS';
  } else if(accuracy >= 95) {
    rank = 'S';
  } else if(accuracy >= 90) {
    rank = 'A';
  } else if(accuracy >= 80) {
    rank = 'B';
  } else if(accuracy >= 70) {
    rank = 'C';
  } else {
    rank = 'F';
  }
  rankImg.src = `/images/parts/elements/${rank}.png`;
  scoreInfoRank.style.setProperty('--background', `url('/images/parts/elements/${rank}back.png')`);

  scoreContainer.style.opacity = '1';
  scoreContainer.style.pointerEvents = 'all';

  missCtx.beginPath();
  missCtx.fillStyle = '#FFF';
  missCtx.strokeStyle = '#FFF';
  missCtx.lineWidth = 5;
  missCtx.moveTo(0, missCanvas.height * 0.8);
  missCtx.lineTo(missCanvas.width, missCanvas.height * 0.8);
  missCtx.stroke();
  let length = song.duration() * 1000;
  missCtx.fillStyle = '#F00';
  missCtx.strokeStyle = '#FFF';
  missCtx.lineWidth = 2;
  for(let i = 0; i < missPoint.length; i++) {
    missCtx.beginPath();
    missCtx.arc(missCanvas.width * (missPoint[i] / length), missCanvas.height * 0.8, missCanvas.height * 0.1, 0, 2 * Math.PI);
    missCtx.fill();
    missCtx.stroke();
  }
  if(missPoint.length == 0) {
    missCtx.fillStyle = '#FFF';
    missCtx.font = "500 3vh Metropolis";
    missCtx.textAlign = "right";
    missCtx.textBaseline = "bottom";
    missCtx.fillText('Perfect!', missCanvas.width - 10, missCanvas.height * 0.8 - 10);  
  }
};

const trackMouseSelection = (i, v1, v2, x, y) => {
  const powX = (mouseX - x) * canvasContainer.offsetWidth / 200 * pixelRatio * settings.display.canvasRes / 100;
  const powY = (mouseY - y) * canvasContainer.offsetHeight / 200 * pixelRatio * settings.display.canvasRes / 100;
  switch(v1) {
    case 0:
      if(Math.sqrt(Math.pow(powX, 2) + Math.pow(powY, 2)) <= canvas.width / 40 + canvas.width / 70) {
        pointingCntElement.push({"v1": v1, "v2": v2, "i": i});
      }
      break;
    case 1:
      if(Math.sqrt(Math.pow(powX, 2) + Math.pow(powY, 2)) <= canvas.width / 80) {
        if(!destroyedBullets.has(i)) {
          bullet++;
          missPoint.push(song.seek() * 1000);
          combo = 0;
          callBulletDestroy(i);
        }
      }
      break;
    default:
      ctx.font = "18px Metropolis";
      ctx.fillStyle = "#F55";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`trackMouseSelection:Undefined element.`, canvas.width / 100, canvas.height / 100);
      console.error(`trackMouseSelection:Undefined element.`);
  }
};

const compClicked = (isTyped) => {
  if(!isTyped && !settings.input.mouse || !(!isMenuOpened && menuAllowed)) {
    return;
  }
  mouseClicked = true;
  mouseClickedMs = Date.now();
  for(let i = 0; i < pointingCntElement.length; i++) {
    if(pointingCntElement[i].v1 === 0 && !destroyedNotes.has(pointingCntElement[i].i)) {
      drawParticle(1, mouseX, mouseY);
      let seek = song.seek() * 1000;
      let ms = pattern.patterns[pointingCntElement[i].i].ms;
      let perfectJudge = 60000 / bpm / 8;
      let greatJudge = 60000 / bpm / 5;
      let goodJudge = 60000 / bpm / 3;
      let badJudge = 60000 / bpm / 2;
      let x = pattern.patterns[pointingCntElement[i].i].x;
      let y = pattern.patterns[pointingCntElement[i].i].y;
      if(seek < ms + perfectJudge && seek > ms - perfectJudge) {
        calculateScore('perfect', pointingCntElement[i].i);
        drawParticle(3, x, y, 'Perfect');
        perfect++;
      } else if(seek < ms + greatJudge && seek > ms - greatJudge) {
        calculateScore('great', pointingCntElement[i].i);
        drawParticle(3, x, y, 'Great');
        great++;
      } else if(seek > ms - goodJudge && seek < ms) {
        calculateScore('good', pointingCntElement[i].i);
        drawParticle(3, x, y, 'Good');
        good++;
      } else if((seek > ms - badJudge && seek < ms) || ms < seek) {
        calculateScore('bad', pointingCntElement[i].i);
        drawParticle(3, x, y, 'Bad');
        bad++;
      } else {
        calculateScore('miss', pointingCntElement[i].i);
        drawParticle(3, x, y, 'Miss');
        miss++;
      }
      return;
    }
  }
  drawParticle(2, mouseX, mouseY);
};

const compReleased = () => {
  mouseClicked = false;
  mouseClickedMs = Date.now();
};

const calculateScore = (judge, i, isMissed) => {
  destroyedNotes.add(i);
  if(!isMissed) {
    pattern.patterns[i].ms = song.seek() * 1000;
  }
  if(judge == 'miss') {
    combo = 0;
    return;
  }
  tick.play();
  combo++;
  if(maxCombo < combo) {
    maxCombo = combo;
  }
  if(judge == 'perfect') {
    score += 200 + combo * 2;
  } else if(judge == 'great') {
    score += 150 + combo * 1.5;
  } else if(judge == 'good') {
    score += 100 + combo * 1;
  } else {
    combo = 0;
    score += 50;
  }
  if(combo % comboCount == 0 && combo != 0) {
    comboAlertMs = Date.now();
    comboAlertCount = combo;
  }
};

Pace.on('done', () => {
  setTimeout(() => {
    cntRender();
    document.getElementById('componentCanvas').classList.add('opacity1');
    document.getElementById('loadingContainer').classList.remove('opacity1');
    document.getElementById('loadingContainer').classList.add('opacity0');
    document.getElementById('wallLeft').style.left = '0vw';
    document.getElementById('wallRight').style.right = '0vw';
    setTimeout(() => {
      document.getElementById('loadingContainer').style.display = 'none';
      document.getElementById('componentCanvas').style.transitionDuration = '0s';
    }, 1000);
    setTimeout(songPlayPause, 4000);
  }, 1000);
});

const songPlayPause = () => {
  if(song.playing()) {
    song.pause();
    menuAllowed = false;
  } else {
    song.play();
    menuAllowed = true;
  }
};

const resume = () => {
  menuContainer.style.display = 'none';
  isMenuOpened = false;
  song.play();
};

const retry = () => {
  song.seek(0);
  pattern = {};
  pointingCntElement = [{"v1": '', "v2": '', "i": ''}];
  circleBulletAngles = [];
  destroyParticles = [];
  destroyedBullets = new Set([]);
  destroyedNotes = new Set([]);
  mouseX = 0, mouseY = 0;
  bpm = 0, speed = 0;
  score = 0, combo = 0, displayScore = 0;
  perfect = 0;
  great = 0;
  good = 0;
  bad = 0;
  miss = 0;
  bullet = 0;
  mouseClicked = false;
  menuAllowed = false;
  mouseClickedMs = -1;
  frameCounterMs = Date.now();
  menuContainer.style.display = 'none';
  isMenuOpened = false;
  initialize(true);
  settingApply();
  setTimeout(songPlayPause, 4000);
};

const editor = () => {
  window.location.href = `${url}/editor`;
};

const home = () => {
  window.location.href = url;
};

document.onkeydown = e => {
  e = e || window.event;
  if(!isResultShowing) {
    if(e.key == 'Escape') {
      e.preventDefault();
      if(menuAllowed) {
        if(menuContainer.style.display == 'none') {
          isMenuOpened = true;
          menuContainer.style.display = 'flex';
          song.pause();
        } else {
          isMenuOpened = false;
          menuContainer.style.display = 'none';
          song.play();
        }
      }
      return;
    }
    if(inputMode == 1 && !/^[a-z]{1}$/i.test(e.key)) {
      return;
    } else if(inputMode == 2 && !/^[zx]{1}$/i.test(e.key)) {
      return;
    }
    compClicked(true);
  } else {
    if(confirm(returnToEditor)) {
      editor();
    }
  }
};

document.onkeyup = e => {
  e = e || window.event;
  if(e.key == 'Escape') {
    return;
  }
  mouseClicked = false;
  mouseClickedMs = Date.now();
};

window.addEventListener("resize", () => {
  initialize(false);
});