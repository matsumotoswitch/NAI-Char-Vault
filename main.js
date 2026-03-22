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
// 3. UIコンポーネント制御（通知・クリップボード）
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
// 4. データ管理ロジック
// ==========================================
/**
 * アプリケーションのデータを取得する
 * 初回起動時は data.js の初期データをローカルストレージに保存して単一のデータベースとして扱います。
 * @returns {Array} 描画用の作品データ配列
 */
function loadData() {
    let data = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, null);
    
    // ローカルストレージにデータがない（初回起動時）場合は data.js のデータを登録
    if (!data) {
        data = JSON.parse(JSON.stringify(worksData));
        setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, data);
    }
    
    // キャラクターが0人の作品は除外して返す
    return data.filter(work => work.characters.length > 0);
}

// ==========================================
// 5. UI描画ロジック (DOMの動的生成)
// ==========================================
/**
 * キャラクターカードのDOM要素を生成する
 * @param {Object} work - 所属する作品のデータ
 * @param {Object} char - キャラクターデータ
 * @returns {HTMLElement} カード要素
 */
function createCharacterCard(work, char) {
    const card = document.createElement('div');
    card.className = 'character-card';
    
    card.addEventListener('click', () => {
        // 基本は手動登録時のデータを使用
        let copyName = char.nameEn || char.name;
        let copyTitle = work.titleEn || work.title;

        // DBにAPIの生データ(JSON)が保存されている場合は、コピー時に動的に構成する
        if (char.rawData && char.rawData.name) {
            copyName = char.rawData.name.full.toLowerCase();
            if (char.rawData.name.last && char.rawData.name.first) {
                copyName = `${char.rawData.name.last} ${char.rawData.name.first}`.toLowerCase();
            }
        }
        if (work.rawMediaData && work.rawMediaData.title) {
            const t = work.rawMediaData.title;
            copyTitle = (t.romaji || t.english || work.title).toLowerCase();
        }

        copyToClipboard(`${copyName} (${copyTitle})`, char.name);
    });

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

/**
 * 作品セクションのDOM要素を生成する
 * @param {Object} work - 作品データ
 * @returns {HTMLElement} セクション要素
 */
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

/**
 * 画面が空になった場合に案内メッセージを表示する
 */
function checkEmptyState() {
    if (appContainer.children.length === 0) {
        appContainer.innerHTML = '<p style="text-align:center; color: var(--text-sub); padding: 40px;">キャラクターが登録されていません。<br>右下のボタンから追加してください。</p>';
    }
}

/**
 * アプリケーションの画面全体を再描画する
 */
function renderApp() {
    appContainer.innerHTML = ''; // 既存の要素をクリア
    const dataToRender = loadData();

    if (dataToRender.length === 0) {
        checkEmptyState();
        return;
    }

    dataToRender.forEach(work => {
        appContainer.appendChild(createWorkSection(work));
    });
}

// ==========================================
// 6. キャラクター登録・API連携ロジック
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

    renderApp();
    addModal.classList.remove('show');
    addForm.reset();
    showToast(`「${name}」を登録しました！`);
});

/**
 * API取得ボタンのローディング状態を切り替える
 * @param {boolean} isLoading - 取得中かどうか
 */
function setLoadingState(isLoading) {
    autoFetchBtn.textContent = isLoading ? '取得中...' : 'アニメDBから一括登録';
    autoFetchBtn.disabled = isLoading;
}

/**
 * アニメDBから取得したデータを整形してローカルストレージに保存する
 * @param {Object} media - AniList APIから取得した作品データ
 * @param {string} titleInput - ユーザーが入力した検索クエリ（フォールバック用）
 */
function processAnimeData(media, titleInput) {
    const fetchedTitle = media.title.native || media.title.romaji || titleInput;
    const fetchedTitleEn = media.title.romaji || media.title.english || titleInput;
    const characters = media.characters.edges.map(edge => edge.node);

    if (characters.length === 0) throw new Error('キャラクター情報が見つかりませんでした。');

    const customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);

    let work = customData.find(w => w.title === fetchedTitle);
    if (!work) {
        // キャラクター一覧が重複して巨大化するのを防ぐため、作品情報のみを分離して保存
        const rawMediaData = JSON.parse(JSON.stringify(media));
        delete rawMediaData.characters;

        work = { title: fetchedTitle, titleEn: fetchedTitleEn.toLowerCase(), rawMediaData: rawMediaData, characters: [] };
        customData.push(work);
    } else if (!work.rawMediaData) {
        const rawMediaData = JSON.parse(JSON.stringify(media));
        delete rawMediaData.characters;
        work.rawMediaData = rawMediaData;
    }

    let addedCount = 0;
    characters.forEach(c => {
        const charName = c.name.native || c.name.full;
        if (!work.characters.find(existing => existing.name === charName)) {
            
            work.characters.push({ 
                name: charName, 
                image: c.image.large,
                rawData: c // APIから取得したキャラクターの生JSONをそのまま保存
            });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, customData);
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
/**
 * 特定のキャラクターを削除する
 * @param {string} title - 作品名
 * @param {string} charName - キャラクター名
 */
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

/**
 * 特定の作品とそれに含まれるキャラクターをすべて削除する
 * @param {string} title - 作品名
 */
function deleteTitle(title) {
    let customData = getStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, []);
    customData = customData.filter(w => w.title !== title);
    setStorage(STORAGE_KEYS.CUSTOM_CHARACTERS, customData);
}

// ==========================================
// 8. アプリケーションの初期化
// ==========================================
renderApp();