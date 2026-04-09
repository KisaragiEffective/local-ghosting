import init, { convert, supported_encodings } from './pkg/local_ghosting.js';

let wasmReady = false;
let encodings = [];

async function boot() {
    await init();
    wasmReady = true;
    encodings = Array.from(supported_encodings());
}

document.addEventListener('DOMContentLoaded', () => {
    boot().catch(err => {
        console.error('WASM init failed:', err);
    });

    document.getElementById('convert-btn').addEventListener('click', runConversion);

    document.getElementById('input-text').addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            runConversion();
        }
    });
});

function runConversion() {
    if (!wasmReady) return;
    const input = document.getElementById('input-text').value;
    if (!input) return;
    renderResults(input);
}

function renderResults(input) {
    const section = document.getElementById('results-section');
    const srcTabBar = document.getElementById('src-tabs');
    const srcPanels = document.getElementById('src-panels');

    srcTabBar.innerHTML = '';
    srcPanels.innerHTML = '';
    section.hidden = false;

    encodings.forEach((srcEnc, i) => {
        const tab = document.createElement('button');
        tab.className = 'tab-btn' + (i === 0 ? ' active' : '');
        tab.textContent = srcEnc;
        tab.dataset.index = i;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        srcTabBar.appendChild(tab);

        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        panel.hidden = i !== 0;
        panel.appendChild(buildInnerTabs(input, srcEnc));
        srcPanels.appendChild(panel);
    });

    srcTabBar.addEventListener('click', (e) => {
        if (!e.target.matches('.tab-btn')) return;
        activateTab(srcTabBar, srcPanels, parseInt(e.target.dataset.index));
    });

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildInnerTabs(input, srcEnc) {
    const container = document.createElement('div');

    const innerTabBar = document.createElement('div');
    innerTabBar.className = 'tab-bar inner';
    innerTabBar.setAttribute('role', 'tablist');
    innerTabBar.setAttribute('aria-label', `${srcEnc} → 変換先`);

    const innerPanels = document.createElement('div');
    innerPanels.className = 'inner-panels';

    encodings.forEach((dstEnc, j) => {
        const tab = document.createElement('button');
        tab.className = 'tab-btn' + (j === 0 ? ' active' : '');
        tab.textContent = dstEnc;
        tab.dataset.index = j;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', j === 0 ? 'true' : 'false');
        innerTabBar.appendChild(tab);

        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        panel.hidden = j !== 0;

        const pre = document.createElement('pre');
        try {
            const result = convert(input, srcEnc, dstEnc);
            pre.className = 'result';
            pre.textContent = result;
        } catch (err) {
            pre.className = 'result error';
            pre.textContent = `[エラー: ${err}]`;
        }
        panel.appendChild(pre);
        innerPanels.appendChild(panel);
    });

    innerTabBar.addEventListener('click', (e) => {
        if (!e.target.matches('.tab-btn')) return;
        activateTab(innerTabBar, innerPanels, parseInt(e.target.dataset.index));
    });

    container.appendChild(innerTabBar);
    container.appendChild(innerPanels);
    return container;
}

function activateTab(tabBar, panels, index) {
    tabBar.querySelectorAll('.tab-btn').forEach((btn, i) => {
        const active = i === index;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.querySelectorAll(':scope > .tab-panel').forEach((p, i) => {
        p.hidden = i !== index;
    });
}
