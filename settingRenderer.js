const { desktopCapturer, remote, BrowserView, ipcRenderer } = require('electron');
const { screen, app, BrowserWindow, Menu, MenuItem } = remote;
const webContents = remote.getCurrentWebContents();
const mainWindowId = 1;
const waitTransition = require('./waitTransition')

var ref;

const show = () => {
    setting.classList.add('show');
    ok.classList.add('show');
}
const setupButton = () => {

    // speakerButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'speaker');
    // micButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'mic');
  
    // XLButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'resize', 'XL');
    // LButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'resize', 'L');
    // MButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'resize', 'M');
    // SButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'resize', 'S');
    // XSButton.onclick = () => ipcRenderer.sendTo(mainWindowId, 'resize', 'XS');

    let buttons = document.querySelectorAll('#setting > div > div');
    buttons.forEach(button => {
        button.onclick = ev => {


            let siblings = button.parentNode.children;
            for (let i = 0; i < siblings.length; i++) {
                let sibling = siblings[i];
                sibling.classList.remove('active');
            }
            button.classList.add('active');

            let channel = button.parentNode.classList[0];
            let arg = button.id.replace('Button', '');
            ipcRenderer.sendTo(mainWindowId, channel, arg);

        }
    })

}


const hideThenClose = async () => {

    setting.classList.remove('show');
    ok.classList.remove('show');

    await waitTransition(setting);
    remote.getCurrentWindow().close();

}

ok.onclick = hideThenClose;
ipcRenderer.on('hideThenClose', hideThenClose)
ipcRenderer.on('message', (ev, msg) =>  console.log(msg) );
ipcRenderer.on('ref', (ev, ref) => {

    let buttons = document.querySelectorAll('#setting > div');

    buttons.forEach( button => button.classList.remove('active') )

    for (key in ref) {
        let button = document.querySelector(`#${ref[key]}Button`);
        button.classList.add('active');
    }
    
} )

setupButton();
ipcRenderer.sendTo(mainWindowId, 'requestRef')
show();

