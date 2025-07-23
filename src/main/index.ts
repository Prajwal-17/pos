import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import * as schema from "../db/schema.ts"
import { db } from "../db/db.ts"

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.maximize()
    }, 25)
    mainWindow.show()
  })

  // catch keyboard events 
  // https://stackoverflow.com/a/75716165/25649886
  mainWindow.webContents.on("before-input-event", (_, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      mainWindow.webContents.isDevToolsOpened()
        ? mainWindow.webContents.closeDevTools()
        : mainWindow.webContents.openDevTools({ mode: 'right' });
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function testDb() {
  try {
    console.log("inside")
    const response = await db.insert(schema.users).values({
      id: Math.random().toString(),
      name: "prajwal",
      password: "hello world",
    })
    console.log(response)

    const result = await db.select().from(schema.users);
    console.log("result", result)

  } catch (error) {
    console.log(error)
  }
}

app.whenReady().then(() => {

  testDb()

  electronApp.setAppUserModelId('com.electron')

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
