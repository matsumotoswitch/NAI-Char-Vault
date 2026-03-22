/**
 * メインロジック
 * ※データ(worksData)は data.js で定義されています
 */

// ==========================================
// 1. DOM要素・グローバル変数の初期化
// ==========================================
const appContainer = document.getElementById('app');
const toast = document.getElementById('toast');
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
// 4. 画面（HTML）の動的生成
// ==========================================
/**
 * worksDataの配列をループ処理し、各作品・キャラクターのHTML要素を生成して画面に追加する
 */
function renderApp() {
    worksData.forEach(work => {
        // セクションの作成
        const workSection = document.createElement('div');
        workSection.className = 'work-section';

        // タイトルの作成
        const title = document.createElement('h2');
        title.className = 'work-title';
        title.textContent = work.title;
        workSection.appendChild(title);

        // キャラクターグリッドの作成
        const grid = document.createElement('div');
        grid.className = 'character-grid';

        work.characters.forEach(char => {
            // キャラクターカードの作成
            const card = document.createElement('div');
            card.className = 'character-card';
            // ★ カード全体にクリックイベントを紐付け ★
            card.addEventListener('click', () => copyToClipboard(char.prompt, char.name));

            // 画像要素の作成
            const img = document.createElement('img');
            img.className = 'character-image';
            img.src = char.image;
            img.alt = char.name;

            // 名前要素の作成
            const name = document.createElement('p');
            name.className = 'character-name';
            name.textContent = char.name;

            // カードに画像と名前を追加し、グリッドに配置
            card.appendChild(img);
            card.appendChild(name);
            grid.appendChild(card);
        });

        workSection.appendChild(grid);
        appContainer.appendChild(workSection);
    });
}

// ==========================================
// 5. アプリケーションの初期化
// ==========================================
renderApp();