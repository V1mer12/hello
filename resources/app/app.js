const sections = [
  {
    id: 'today',
    title: 'Сьогодні',
    render: (workspace) => `
      <div class="card">
        <h2>Фокус дня</h2>
        <div class="tag">${workspace.today.focus}</div>
        <div class="inline-note">Скорочений план на 1 день.</div>
      </div>
      <div class="card">
        <h2>Завдання</h2>
        <ul>
          ${workspace.today.tasks.map((task) => `<li>${task}</li>`).join('')}
        </ul>
      </div>
    `
  },
  {
    id: 'learning',
    title: 'Навчання',
    render: (workspace) => `
      <div class="card">
        <h2>Мови та розклад</h2>
        ${workspace.learning.schedule.map((item) => `<div class="tag">${item}</div>`).join('')}
      </div>
      <div class="card">
        <h2>Self-testing</h2>
        <ul>
          ${workspace.learning.selfTesting.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h2>Активне пригадування</h2>
        <div class="tag">${workspace.learning.activeRecall ? 'Увімкнено' : 'Вимкнено'}</div>
        <div class="tag">${workspace.learning.spacedRepetition ? 'Повторення через інтервали' : 'Без повторення'}</div>
      </div>
      <div class="card">
        <h2>Журнал помилок</h2>
        <ul>
          ${workspace.learning.errorLog.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="card" style="grid-column: 1 / -1;">
        <h2>Англійська — A0</h2>
        <div class="word-grid">
          ${workspace.learning.languages[0].words.map((entry) => `
            <div class="word-item">
              <strong>${entry.word}</strong>
              <span>Українською: ${entry.translate}</span>
              <small>Чанки: ${entry.chunks.join(' • ')}</small>
            </div>
          `).join('')}
        </div>
      </div>
    `
  },
  {
    id: 'income',
    title: 'Заробіток',
    render: (workspace) => `
      <div class="card">
        <h2>Канали</h2>
        <ul>
          ${workspace.income.channels.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h2>Цілі</h2>
        <ul>
          ${workspace.income.goals.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `
  },
  {
    id: 'resources',
    title: 'Ресурси',
    render: (workspace) => `
      <div class="card">
        <h2>Бібліотека</h2>
        <ul>
          ${workspace.resources.list.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h2>OpenAI</h2>
        <div class="inline-note">API ключ не пишемо в код. Краще передавати через змінну середовища MYBIBLIA_OPENAI_KEY або OPENAI_API_KEY.</div>
      </div>
    `
  },
  {
    id: 'wheel',
    title: 'Колесо',
    render: (workspace) => `
      <div class="card" style="grid-column: 1 / -1;">
        <h2>Життєве колесо</h2>
        ${workspace.wheel.lifeFocus.map((item) => `<div class="tag">${item}</div>`).join('')}
      </div>
    `
  },
  {
    id: 'diary',
    title: 'Щоденник',
    render: (workspace) => `
      <div class="card" style="grid-column: 1 / -1;">
        <h2>Нотатки</h2>
        <ul>
          ${workspace.diary.notes.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `
  }
];

let currentWorkspace = null;
let activeSectionId = 'today';

function buildNavigation() {
  const nav = document.getElementById('nav');
  nav.innerHTML = sections.map((section) => `
    <button class="nav-item ${section.id === activeSectionId ? 'active' : ''}" data-section="${section.id}">
      ${section.title}
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      activeSectionId = button.dataset.section;
      render();
    });
  });
}

function render() {
  const section = sections.find((item) => item.id === activeSectionId) || sections[0];
  document.getElementById('screen-title').textContent = section.title;
  document.getElementById('screen-content').innerHTML = section.render(currentWorkspace);
  buildNavigation();
}

async function loadWorkspace() {
  const info = await window.myBIBLIA.getAppInfo();
  const workspace = await window.myBIBLIA.loadWorkspace();
  currentWorkspace = workspace;
  document.title = `${info.appName} ${info.version}`;
  render();
}

async function saveWorkspace() {
  if (!currentWorkspace) {
    return;
  }

  currentWorkspace = await window.myBIBLIA.saveWorkspace(currentWorkspace);
  render();
}

document.getElementById('save-button').addEventListener('click', saveWorkspace);

window.addEventListener('DOMContentLoaded', () => {
  loadWorkspace();
});
