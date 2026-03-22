/**
 * キャラクタープロンプトのデータ定義ファイル
 * 
 * 新しい作品やキャラクターを追加する場合は、この配列(worksData)にデータを追加してください。
 * 画面の描画は自動的に行われます。
 * 
 * @typedef {Object} Character
 * @property {string} name - キャラクター名
 * @property {string} image - 表示する画像のURL
 * @property {string} prompt - 画像生成AI用のプロンプト
 * 
 * @typedef {Object} Work
 * @property {string} title - 作品名（見出しとして表示）
 * @property {Character[]} characters - キャラクターのリスト
 */
const worksData = [
    {
        title: "ファンタジーRPG",
        characters: [
            {
                name: "エルフの弓使い",
                image: "https://via.placeholder.com/150/228B22/FFFFFF?text=Elf", // 手持ちの画像URLに変更してください
                prompt: "1girl, elf, long blonde hair, green eyes, pointy ears, fantasy armor, holding bow, forest background, masterpiece, best quality"
            },
            {
                name: "炎の魔法使い",
                image: "https://via.placeholder.com/150/FF4500/FFFFFF?text=Mage",
                prompt: "1girl, witch, red hair, twin tails, red eyes, holding staff, casting fire magic, dynamic pose, masterpiece"
            }
        ]
    },
    {
        title: "サイバーパンク",
        characters: [
            {
                name: "ハッカー",
                image: "https://via.placeholder.com/150/4B0082/FFFFFF?text=Hacker",
                prompt: "1boy, solo, short black hair, wearing vr headset, cyberpunk city background, glowing neon lights, cool, masterpiece"
            }
        ]
    }
];