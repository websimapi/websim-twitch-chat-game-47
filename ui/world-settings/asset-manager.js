import * as StorageManager from '../../storage-manager.js';

// Default assets mapping
const ASSET_DEFINITIONS = [
    { key: 'grass', label: 'Grass Tile (32x32)', defaultSrc: './grass_tile.png' },
    { key: 'tree', label: 'Tree', defaultSrc: './tree.png' },
    { key: 'logs', label: 'Logs', defaultSrc: './logs.png' },
    { key: 'bushes', label: 'Bushes', defaultSrc: './bushes.png' },
    { key: 'flowers', label: 'Flowers', defaultSrc: './flowers.png' }
];

export function initAssetManager(channel, worldName) {
    const container = document.getElementById('assets-list-container');
    let currentAssets = {};

    async function loadCurrentAssets() {
        const gameState = await StorageManager.loadGameState(channel, worldName);
        currentAssets = gameState.assets || {};
        renderAssetsList();
    }

    async function saveAsset(key, url) {
        currentAssets[key] = url;
        await StorageManager.saveWorldAssets(channel, worldName, currentAssets);
        renderAssetsList();
    }

    async function resetAsset(key) {
        if (currentAssets[key]) {
            delete currentAssets[key];
            await StorageManager.saveWorldAssets(channel, worldName, currentAssets);
            renderAssetsList();
        }
    }

    function renderAssetsList() {
        container.innerHTML = '';
        const list = document.createElement('div');
        list.className = 'asset-list';

        ASSET_DEFINITIONS.forEach(def => {
            const assetRow = document.createElement('div');
            assetRow.className = 'asset-row';

            const currentSrc = currentAssets[def.key] || def.defaultSrc;
            const isOverridden = !!currentAssets[def.key];

            assetRow.innerHTML = `
                <div class="asset-preview">
                    <img src="${currentSrc}" alt="${def.label}">
                </div>
                <div class="asset-info">
                    <h4>${def.label}</h4>
                    <p class="status">${isOverridden ? '<span style="color: #4CAF50;">Custom Override Active</span>' : '<span style="color: #aaa;">Default</span>'}</p>
                </div>
                <div class="asset-actions">
                    <label class="upload-btn">
                        Upload New
                        <input type="file" class="asset-file-input" data-key="${def.key}" accept="image/*" style="display: none;">
                    </label>
                    ${isOverridden ? `<button class="reset-btn" data-key="${def.key}">Reset</button>` : ''}
                </div>
            `;

            list.appendChild(assetRow);
        });

        container.appendChild(list);

        // Bind events
        container.querySelectorAll('.asset-file-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const key = e.target.dataset.key;

                // Feedback
                const label = e.target.parentElement;
                const originalText = label.firstChild.textContent;
                label.firstChild.textContent = "Uploading...";

                try {
                    const url = await window.websim.upload(file);
                    await saveAsset(key, url);
                } catch (err) {
                    console.error("Upload failed:", err);
                    alert("Failed to upload image.");
                    label.firstChild.textContent = originalText;
                }
            });
        });

        container.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                resetAsset(btn.dataset.key);
            });
        });
    }

    loadCurrentAssets();
}