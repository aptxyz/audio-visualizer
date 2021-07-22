// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { desktopCapturer, remote, BrowserView, ipcRenderer } = require('electron');
const { screen, app, BrowserWindow, Menu, MenuItem } = remote;
const webContents = remote.getCurrentWebContents();
const mainWindow = remote.getCurrentWindow();
const waitTransition = require('./waitTransition')

const ref = {
  devMode: false,
  size: 'L',
  audioInput: 'speaker',
  drawType: 'freq',
};

ipcRenderer.on('message', (ev, msg) => console.log(msg) )
ipcRenderer.on('requestRef', (ev, msg) => {
  console.log('requested reference', ev, ev.sender, ev.senderId)
  console.log(ref);
  ipcRenderer.sendTo(ev.senderId, 'ref', {
    audioInput: ref.audioInput,
    size: ref.size,
    drawType: ref.drawType
  })
})

const getAudioDevices = async () => {

  // 搞了半天，原来 electron 音源只能选 desktop 无法细致到指定窗口。

  let mic = [];
  let speaker = [];
  let win = [];

  const windowDevices = await desktopCapturer.getSources({ types: ['window', 'screen'] });
  const inputDevices = await navigator.mediaDevices.enumerateDevices();


  for (let device of windowDevices) {
    if (device.name.match('Audio Visualizer')) continue;
      win.push({
          type: 'window',
          id: device.id,
          label: `[窗口] ${device.name}`,
          thumbnail: device.thumbnail
      })
  }

  for (let device of inputDevices) {

      switch (device.kind) {
          default: 
              break;
          case 'audioinput': 
            if (device.deviceId.match('default')) continue;
              mic.push({
                  type: 'mic',
                  id: device.deviceId,
                  label: `[麦克风] ${device.label}`
              })
              break;
          case 'audiooutput':
            if (device.deviceId.match('communications')) continue;
              speaker.push({
                  type: 'speaker',
                  id: device.deviceId,
                  label: `[扬声器] ${device.label}`
              })
              break;
      }

  }

  ref.devices = [...win, ...speaker, ...mic];

}
const setupAudio = async (type) => {

  let constraints;

  ref.audioInput = type;

  if (type == 'speaker') {

    constraints = {
      audio: { mandatory: { chromeMediaSource: 'desktop'}},
      video: { mandatory: { chromeMediaSource: 'desktop'}},
    }
    // speakerButton.classList.add('active');
    // micButton.classList.remove('active');

  } else if (type == 'mic') {

    constraints = {
      audio: true,
      video: false,
    }
    // micButton.classList.add('active');
    // speakerButton.classList.remove('active');

  }

  let stream = await navigator.mediaDevices.getUserMedia(constraints)

  if (ref.audioCtx) ref.audioCtx.close();
  let audioCtx = ref.audioCtx = new AudioContext();
  let audioInput = audioCtx.createMediaStreamSource(stream);
  let analyser = ref.analyser = audioCtx.createAnalyser();
  
  audioInput.connect(analyser);
  // analyser.connect(audioCtx.destination);

  analyser.fftSize = 2048;

}
const resize = async (size) => {

  ref.size = size;

  if (canvas.className) {
    canvas.className = '';
    await waitTransition(canvas);  
  }
  
  let length;
  switch(size) {
    case 'XL': length = 800; break;
    case 'L':  length = 400; break;
    case 'M':  length = 200; break;
    case 'S':  length = 100; break;
    case 'XS': length = 50; break;
  }

  ref.length = length;
  
  let bounds1 = mainWindow.getBounds();
  let centerX = bounds1.x + bounds1.width / 2;
  let centerY = bounds1.y + bounds1.height / 2;
  let left = Math.round(centerX - length / 2);
  let top = Math.round(centerY - length / 2);

  mainWindow.setPosition(left, top)
  mainWindow.setSize(length, length)

  let html = document.querySelector('html').style;
  html.width = html.height = length;

  nav.className = size;
  canvas.classList.add('show');
  canvas.width = canvas.height = length;

  ref.ctx.clearRect(0, 0, length, length);

}

const setupSetting = () => {

  settingButton.onclick = () => ipcRenderer.send('toggleSetting');
  devButton.onclick = () => webContents.toggleDevTools();
  reloadButton.onclick = () => {app.relaunch(); app.exit();};
  closeButton.onclick = () => app.exit();
  
  ipcRenderer.on('audioInput', (ev, input ) => setupAudio(input) );
  ipcRenderer.on('size', (ev, size ) => resize(size) )
  ipcRenderer.on('draw', (ev, type) => ref.drawType = type )

}
const setupDevMode = (mode) => {

  if (ref.devMode) {
    webContents.openDevTools();
  } else {
    devButton.style.display = 'none';
    reloadButton.style.display = 'none';
  }
  
}

const main = async () => {

  let ctx = ref.ctx = canvas.getContext('2d');

  await setupAudio(ref.audioInput);
  resize(ref.size);
  setupSetting();
  setupDevMode(ref.devMode)
  
  draw();

}




const draw = () => {

    requestAnimationFrame( () => draw() );

    let {ctx, analyser, dataArray, length, drawType} = ref;

    let w = length;
    let h = length;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, w, h );    
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgb(0, 0, 0)';

    ctx.beginPath();




    // ctx.font = "24px serif";
    // ctx.fillStyle = 'red';
    // ctx.fillText(`${step++}`, 50, 150);
    switch (drawType) {
      case 'sine': drawSine(); break;
      case 'freq': drawFreq(); break;
    }

}

let once = true;

const drawSine = () => {

  let {ctx, length, size, analyser} = ref;

  switch(size) {
    case 'XL': analyser.fftSize = 1024; break;
    case 'L':  analyser.fftSize = 512; break;
    case 'M':  analyser.fftSize = 256; break;
    case 'S':  analyser.fftSize = 128; break;
    case 'XS': analyser.fftSize = 64; break;
  }

  let bufferLength = analyser.fftSize;
  let dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  let w = length;
  let h = length;
  
  let sliceWidth = w * 1.0 / bufferLength;
  let x = 0;

  for(let i = 0; i < bufferLength; i++) {

      let average = ( dataArray[i-1] + dataArray[i] + dataArray[i+1] ) / 3
      if ( i == 1 ) average = ( dataArray[i] + dataArray[i+1] ) / 2;
      if ( i + 1 == bufferLength ) average = ( dataArray[i-1] + dataArray[i] ) /2;
      var v = average / 128.0;

      var y = v * h/2;

      if(i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;

    }

    ctx.lineTo(w, h/2);
    ctx.stroke();
}


const drawFreq = () => {

    let {analyser, length ,ctx, size } = ref;

    switch(size) {
      case 'XL': analyser.fftSize = 256; break;
      case 'L':  analyser.fftSize = 128; break;
      case 'M':  analyser.fftSize = 64; break;
      case 'S':  analyser.fftSize = 32; break;
      case 'XS': analyser.fftSize = 32; break;
    }

    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

      analyser.getByteFrequencyData(dataArray);

      let w = length;
      let h = length;
      let barWidth = (w / bufferLength) - 1;
      let x = 0;

      for(let i = 0; i < bufferLength; i++) {

        let barHeight = h * dataArray[i] / 255;
        let alpha = 0.25 + 0.5 * dataArray[i] / 255;

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.fillRect(x, h - barHeight, barWidth, barHeight);
        // ctx.fillRect(100, 100, 300, 300)

        x += barWidth + 1;

      }

    

}

main();