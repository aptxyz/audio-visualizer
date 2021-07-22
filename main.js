// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
require('electron-reloader')(module)

const ref = {};

app.disableHardwareAcceleration();

function createMain () {
  // Create the browser window.
  let mainWindow = ref.mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop : true,
    // resizable: false,
    webPreferences: {
      titleBarStyle: 'customButtonsOnHover',
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.on('system-context-menu', ev => {
    // 她喵的，electron 到处是bug，不能禁止右键
    ev.preventDefault();
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.webContents.send('message', `mainWindow id: ${mainWindow.id}`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  createMain()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMain()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


function createSetting () {
  // Create the browser window.
  const settingWindow = ref.settingWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop : true,
    webPreferences: {
      titleBarStyle: 'customButtonsOnHover',
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // preload: path.join(__dirname, 'preload.js')
    }
  })

  settingWindow.setAlwaysOnTop(true, 'pop-up-menu');

  settingWindow.on('system-context-menu', ev => {
    // 她喵的，electron 到处是bug，不能禁止右键
    ev.preventDefault();
  })

  settingWindow.on('closed', ev => {
    ref.settingWindow = null;
    ref.mainWindow.webContents.send('message', 'setting Window is closed')
  })

  // and load the index.html of the app.
  settingWindow.loadFile('setting.html')

  ref.mainWindow.webContents.send('message', `setting Window id: ${settingWindow.id}`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}


ipcMain.on('toggleSetting', (ev) => {

    if (ref.settingWindow) {

      ref.settingWindow.webContents.send('hideThenClose')

    } else {

      createSetting();

    }

})