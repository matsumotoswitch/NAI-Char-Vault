/**
 * キャラクタープロンプトのデータ定義ファイル
 * 
 * 新しい作品やキャラクターを追加する場合は、この配列(worksData)にデータを追加してください。
 * 画面の描画は自動的に行われます。
 * 
 * @typedef {Object} Character
 * @property {string} name - キャラクター名
 * @property {string} nameEn - キャラクター名（英語）
 * @property {string} image - 表示する画像のURL
 * 
 * @typedef {Object} Work
 * @property {string} title - 作品名（見出しとして表示）
 * @property {string} titleEn - 作品名（英語）
 * @property {Character[]} characters - キャラクターのリスト
 */
const worksData = [];
