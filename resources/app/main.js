const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const APP_NAME = 'MyBIBLIA';
const APP_VERSION = '0.3.0';

const appDataRoot = process.env.APPDATA
  ? path.join(process.env.APPDATA, APP_NAME)
  : path.join(os.homedir(), 'AppData', 'Roaming', APP_NAME);

const workspacePath = path.join(appDataRoot, 'workspace.json');

const DEFAULT_WORKSPACE = {
  version: APP_VERSION,
  app: {
    name: APP_NAME,
    theme: 'graphite-dark',
    sections: ['today', 'learning', 'income', 'resources', 'wheel', 'diary']
  },
  today: {
    focus: 'Основна мета дня',
    tasks: [
      'Повторити 5 англійських слів',
      'Пройти 20 хвилин навчання',
      'Записати 1 ідею для продукту'
    ]
  },
  learning: {
    languages: [
      {
        name: 'English',
        level: 'A0',
        words: [
          { word: 'book', translate: 'книга', chunks: ['book', 'a book', 'this book'] },
          { word: 'door', translate: 'двері', chunks: ['door', 'the door', 'open the door'] },
          { word: 'friend', translate: 'друг', chunks: ['friend', 'my friend', 'good friend'] },
          { word: 'water', translate: 'вода', chunks: ['water', 'cold water', 'drink water'] },
          { word: 'home', translate: 'дім', chunks: ['home', 'my home', 'at home'] }
        ]
      }
    ],
    schedule: [
      'ПОНЕДІЛОК - англійська + повторення',
      'ВІВТОРОК - практика + self-testing',
      'СЕРЕДА - помилки та журнал',
      'ЧЕТВЕР - повторення чанків',
      'ПЯТНИЦЯ - синтез результатів'
    ],
    selfTesting: [
      'Що я запам’ятав?',
      'Я пояснюю слово своїми словами',
      'Я перевіряю помилки без підказок'
    ],
    activeRecall: true,
    spacedRepetition: true,
    errorLog: [
      'book → неправильне використання в реченні',
      'door → змішання однини та множини'
    ]
  },
  income: {
    channels: [
      'Арбітраж трафіку',
      'Програмування',
      'Власні продукти',
      'Партнерські проекти',
      'Інші способи заробітку'
    ],
    goals: [
      'Підписати 1 важливий проект',
      'Додати 3 нові ідеї',
      'Вивчити 1 новий канал монетизації'
    ]
  },
  resources: {
    list: [
      'OpenAI для занять',
      'Пошук ресурсів і статей',
      'Курси, шаблони і документи',
      'Посилання на інструменти'
    ]
  },
  wheel: {
    lifeFocus: ['Навчання', 'Здоров’я', 'Розвиток', 'Заробіток', 'Стосунки', 'Мета']
  },
  diary: {
    notes: [
      'Сьогодні — 1 крок до системи.',
      'Результат — краще, ніж хаос.'
    ]
  },
  settings: {
    apiProvider: 'OpenAI',
    model: 'gpt-4o-mini'
  }
};

function ensureDirectory() {
  if (!fs.existsSync(appDataRoot)) {
    fs.mkdirSync(appDataRoot, { recursive: true });
  }
}

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source || {})) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function ensureWorkspace() {
  ensureDirectory();

  if (!fs.existsSync(workspacePath)) {
    fs.writeFileSync(workspacePath, JSON.stringify(DEFAULT_WORKSPACE, null, 2));
    return DEFAULT_WORKSPACE;
  }

  try {
    const raw = fs.readFileSync(workspacePath, 'utf8');
    const parsed = JSON.parse(raw);
    const merged = deepMerge(DEFAULT_WORKSPACE, parsed);
    fs.writeFileSync(workspacePath, JSON.stringify(merged, null, 2));
    return merged;
  } catch (error) {
    console.error('Не вдалося прочитати workspace.json:', error);
    return DEFAULT_WORKSPACE;
  }
}

function backupWorkspace() {
  ensureDirectory();

  if (!fs.existsSync(workspacePath)) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(appDataRoot, `workspace.backup-${timestamp}.json`);
  fs.copyFileSync(workspacePath, backupPath);
  return backupPath;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#101417',
    title: 'My BIBLIA 0.3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

ipcMain.handle('workspace:get', () => {
  return ensureWorkspace();
});

ipcMain.handle('workspace:save', (_event, payload) => {
  ensureDirectory();
  backupWorkspace();
  const safePayload = deepMerge(DEFAULT_WORKSPACE, payload || {});
  fs.writeFileSync(workspacePath, JSON.stringify(safePayload, null, 2));
  return safePayload;
});

ipcMain.handle('app:info', () => ({
  appName: APP_NAME,
  version: APP_VERSION,
  workspacePath,
  appDataRoot,
  hasOpenAiKey: Boolean(process.env.MYBIBLIA_OPENAI_KEY || process.env.OPENAI_API_KEY)
}));

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
