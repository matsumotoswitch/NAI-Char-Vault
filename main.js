/**
 * メインロジック
 * ※データ(worksData)は data.js で定義されています
 */

// ==========================================
// 1.5. ローカルストレージのユーティリティ
// ==========================================
const STORAGE_KEYS = {
    CUSTOM_CHARACTERS: 'customCharacters',
    DELETED_DATA: 'deletedData'
};

function getStorage(key, defaultValue) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ==========================================
// 1. DOM要素・グローバル変数の初期化
// ==========================================
const appContainer = document.getElementById('app');
const toast = document.getElementById('toast');
const addFab = document.getElementById('add-fab');
const addModal = document.getElementById('add-modal');
const addForm = document.getElementById('add-form');
const cancelBtn = document.getElementById('cancel-btn');
const autoFetchBtn = document.getElementById('auto-fetch-btn');
let toastTimeout;

// ==========================================
// 2. クリップボードへのコピー処理
// ==========================================
/**
 * 指定されたプロンプトをクリップボードにコピーし、完了通知を表示する
 * @param {string} prompt - コピーするプロンプト文字列
 * @param {string} charName - キャラクター名（通知用）
 */
async function copyToClipboard(prompt, charName) {
    try {
        // Clipboard APIを使用してテキストをコピー
        await navigator.clipboard.writeText(prompt);
        showToast(`「${charName}」のプロンプトをコピーしました！`);
    } catch (err) {
        console.error('クリップボードへのコピーに失敗しました', err);
        alert('コピーに失敗しました。');
    }
}

// ==========================================
// 3. UIコンポーネント（トースト通知）の制御
// ==========================================
/**
 * 画面下部に数秒間メッセージを表示する
 * @param {string} message - 表示するテキスト
 */
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    
    // 既存のタイマーをクリアして、連続でクリックしても正しく表示されるようにする
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ==========================================
// 4. データのマージ (ローカルストレージ対応)
// ==========================================
/**
 * data.js の基本データと、ブラウザに保存されたカスタムデータを結合する
 */
function getMergedData() {
    // data.js の worksData をディープコピーしてベースにする
    const merged = JSON.parse(JSON.stringify(worksData));
    
    const customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);
    
    customData.forEach(customWork => {
        const existingWork = merged.find(w => w.title === customWork.title);
        if (existingWork) {
            existingWork.characters.push(...customWork.characters);
        } else {
            merged.push(customWork);
        }
    });
    
    const deleted = getStorage(STORAGE_KEYS.DELETED_DATA, { titles: [], characters: {} });
    
    return merged
        .filter(work => !deleted.titles.includes(work.title))
        .map(work => {
            if (deleted.characters[work.title]) {
                work.characters = work.characters.filter(c => !deleted.characters[work.title].includes(c.name));
            }
            return work;
        })
        .filter(work => work.characters.length > 0);
}

// ==========================================
// 5. 画面（HTML）の動的生成
// ==========================================
function createCharacterCard(work, char) {
    const card = document.createElement('div');
    card.className = 'character-card';
    
    const copyName = char.nameEn || char.name;
    const copyTitle = work.titleEn || work.title;
    card.addEventListener('click', () => copyToClipboard(`${copyName} (${copyTitle})`, char.name));

    const deleteCharBtn = document.createElement('button');
    deleteCharBtn.className = 'btn-delete-char';
    deleteCharBtn.innerHTML = '×';
    deleteCharBtn.title = 'キャラクターを削除';
    deleteCharBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionElement = card.closest('.work-section');
        deleteCharacter(work.title, char.name);
        card.remove(); // 画面からカードを直接削除
        // セクション内にキャラクターがいなくなったらセクションごと削除
        if (sectionElement && sectionElement.querySelector('.character-grid').children.length === 0) {
            sectionElement.remove();
        }
        checkEmptyState();
    });

    const img = document.createElement('img');
    img.className = 'character-image';
    img.src = char.image;
    img.alt = char.name;

    const name = document.createElement('p');
    name.className = 'character-name';
    name.textContent = char.name;

    card.append(deleteCharBtn, img, name);
    return card;
}

function createWorkSection(work) {
    const workSection = document.createElement('div');
    workSection.className = 'work-section';

    const header = document.createElement('div');
    header.className = 'work-header';

    const title = document.createElement('h2');
    title.className = 'work-title';
    title.textContent = work.title;

    const deleteTitleBtn = document.createElement('button');
    deleteTitleBtn.className = 'btn-delete-title';
    deleteTitleBtn.innerHTML = '×';
    deleteTitleBtn.title = '作品を削除';
    deleteTitleBtn.addEventListener('click', () => {
        deleteTitle(work.title);
        workSection.remove(); // 画面からセクションを直接削除
        checkEmptyState();
    });

    header.append(title, deleteTitleBtn);
    workSection.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'character-grid';

    work.characters.forEach(char => {
        grid.appendChild(createCharacterCard(work, char));
    });

    workSection.appendChild(grid);
    return workSection;
}

function checkEmptyState() {
    if (appContainer.children.length === 0) {
        appContainer.innerHTML = '<p style="text-align:center; color: var(--text-sub); padding: 40px;">キャラクターが登録されていません。<br>右下のボタンから追加してください。</p>';
    }
}

function renderApp() {
    appContainer.innerHTML = ''; // 既存の要素をクリア
    const dataToRender = getMergedData();

    if (dataToRender.length === 0) {
        checkEmptyState();
        return;
    }

    dataToRender.forEach(work => {
        appContainer.appendChild(createWorkSection(work));
    });
}

// ==========================================
// 6. キャラクター登録フォームの制御
// ==========================================

// モーダルを開く
addFab.addEventListener('click', () => {
    addModal.classList.add('show');
});

// モーダルを閉じる
cancelBtn.addEventListener('click', () => {
    addModal.classList.remove('show');
    addForm.reset();
});

// フォーム送信（保存）処理
addForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('work-title').value.trim();
    const titleEn = document.getElementById('work-title-en').value.trim();
    const name = document.getElementById('char-name').value.trim();
    const nameEn = document.getElementById('char-name-en').value.trim();
    const image = document.getElementById('char-image').value.trim();

    const customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);

    let work = customData.find(w => w.title === title);
    if (!work) {
        work = { title: title, titleEn: titleEn, characters: [] };
        customData.push(work);
    } else if (!work.titleEn) {
        work.titleEn = titleEn;
    }

    work.characters.push({ name, nameEn, image });
    setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, customData);

    // 削除履歴に登録されている場合は解除する
    let deleted = getStorage(STORAGE_KEYS.DELETED_DATA, { titles: [], characters: {} });
    if (deleted.titles.includes(title)) {
        deleted.titles = deleted.titles.filter(t => t !== title);
    }
    if (deleted.characters[title] && deleted.characters[title].includes(name)) {
        deleted.characters[title] = deleted.characters[title].filter(c => c !== name);
    }
    setStorage(STORAGE_KEYS.DELETED_DATA, deleted);

    renderApp();
    addModal.classList.remove('show');
    addForm.reset();
    showToast(`「${name}」を登録しました！`);
});

function setLoadingState(isLoading) {
    autoFetchBtn.textContent = isLoading ? '取得中...' : 'アニメDBから一括登録';
    autoFetchBtn.disabled = isLoading;
}

function processAnimeData(media, titleInput) {
    const fetchedTitle = media.title.native || media.title.romaji || titleInput;
    const fetchedTitleEn = media.title.romaji || media.title.english || titleInput;
    const characters = media.characters.edges.map(edge => edge.node);

    if (characters.length === 0) throw new Error('キャラクター情報が見つかりませんでした。');

    const customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);

    let work = customData.find(w => w.title === fetchedTitle);
    if (!work) {
        work = { title: fetchedTitle, titleEn: fetchedTitleEn.toLowerCase(), characters: [] };
        customData.push(work);
    }

    let deleted = getStorage(STORAGE_KEYS.DELETED_DATA, { titles: [], characters: {} });
    if (deleted.titles.includes(fetchedTitle)) {
        deleted.titles = deleted.titles.filter(t => t !== fetchedTitle);
    }

    let addedCount = 0;
    characters.forEach(c => {
        const charName = c.name.native || c.name.full;
        if (!work.characters.find(existing => existing.name === charName)) {
            
            let charNameEn = c.name.full.toLowerCase();
            if (c.name.last && c.name.first) {
                charNameEn = `${c.name.last} ${c.name.first}`.toLowerCase();
            }

            work.characters.push({ 
                name: charName, 
                nameEn: charNameEn, 
                image: c.image.large 
            });
            addedCount++;

            if (deleted.characters[fetchedTitle] && deleted.characters[fetchedTitle].includes(charName)) {
                deleted.characters[fetchedTitle] = deleted.characters[fetchedTitle].filter(n => n !== charName);
            }
        }
    });

    if (addedCount > 0) {
        setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, customData);
        setStorage(STORAGE_KEYS.DELETED_DATA, deleted);
        renderApp();
        addModal.classList.remove('show');
        addForm.reset();
        showToast(`「${fetchedTitle}」のキャラを${addedCount}人自動登録しました！`);
    } else {
        alert('新しいキャラクターは見つかりませんでした（すべて登録済みです）。');
    }
}

autoFetchBtn.addEventListener('click', async () => {
    const titleInput = document.getElementById('work-title').value.trim();
    if (!titleInput) {
        alert('自動取得するには、まず「作品名」を入力してください。');
        return;
    }

    // AniList GraphQL API のクエリ (ページネーション対応)
    const query = `
    query ($search: String, $page: Int) {
      Media (search: $search, type: ANIME) {
        title { native romaji english }
        characters(sort: ROLE, page: $page, perPage: 50) {
          pageInfo {
            hasNextPage
          }
          edges {
            node {
              name { full native first last }
              image { large }
              gender
            }
          }
        }
      }
    }
    `;

    try {
        setLoadingState(true);

        let page = 1;
        let hasNextPage = true;
        let combinedMedia = null;
        let allEdges = [];

        // 次のページが存在する限り、全キャラクターを取得し続けるループ
        while (hasNextPage) {
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query: query, variables: { search: titleInput, page: page } })
            });

            const json = await response.json();
            console.log('Fetched JSON (Page ' + page + '):', json);
            if (!json.data?.Media) {
                if (page === 1) throw new Error('作品データベースに見つかりませんでした。別のタイトルで試してください。');
                break;
            }

            const media = json.data.Media;
            if (!combinedMedia) combinedMedia = { ...media }; // 1ページ目の作品基本情報をベースにする
            
            allEdges = allEdges.concat(media.characters.edges);
            hasNextPage = media.characters.pageInfo.hasNextPage;
            page++;
        }

        // 全ページの取得が完了したら、合体させたデータを処理へ渡す
        if (combinedMedia) {
            combinedMedia.characters.edges = allEdges;
            processAnimeData(combinedMedia, titleInput);
        }
    } catch (err) {
        alert(err.message || '通信エラーが発生しました。');
    } finally {
        setLoadingState(false);
    }
});

// ==========================================
// 7. 削除処理
// ==========================================
function deleteCharacter(title, charName) {
    let customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);
    
    let workInCustom = customData.find(w => w.title === title);
    if (workInCustom) {
        workInCustom.characters = workInCustom.characters.filter(c => c.name !== charName);
        if (workInCustom.characters.length === 0) {
            customData = customData.filter(w => w.title !== title);
        }
        setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, customData);
    }
}

function deleteTitle(title) {
    let customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);
    customData = customData.filter(w => w.title !== title);
    setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, customData);
}

// ==========================================
// 8. アプリケーションの初期化
// ==========================================
renderApp();