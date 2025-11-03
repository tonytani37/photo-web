// --- 環境設定 ---
// ⚠️ 以下の定数をご自身の情報に置き換えてください
const MICROCMS_ENDPOINT = 'photo'; // microCMSのエンドポイント名（例: 'photos'など）
const GCS_BASE_URL = 'https://storage.googleapis.com/';

// microCMS APIのベースURL
const MICROCMS_BASE_URL = `https://t-cms-api-281456272382.asia-northeast2.run.app/api/v1/${MICROCMS_ENDPOINT}`; // YOUR_SERVICE_IDも置き換えてください
// const MICROCMS_BASE_URL = `http://localhost:8080/api/v1/${MICROCMS_ENDPOINT}`; // YOUR_SERVICE_IDも置き換えてください

// --- DOM要素の取得 ---
const photoGridElement = document.getElementById('photo-grid');
const modalsContainerElement = document.getElementById('modals-container');

const FLASK_PROXY_BASE_URL = 'https://t-cms-api-281456272382.asia-northeast2.run.app/api/v1';
// const FLASK_PROXY_BASE_URL = 'http://localhost:8080/api/v1';

// MicroCMSのコンテンツエンドポイント（例: blogs）とクエリパラメータ
const endpoint = 'photo';
const queryParams = new URLSearchParams({
    limit: 3,
    fields: 'id,class,title,publishedAt,link' // 取得フィールドを制限
});

const url = `${FLASK_PROXY_BASE_URL}/${endpoint}?${queryParams.toString()}`;

/**
 * microCMSからギャラリーデータを取得し、HTMLを構築するメイン関数
 */
async function loadGallery() {
    if (!photoGridElement || !modalsContainerElement) {
        console.error("ギャラリー表示に必要なDOM要素が見つかりません。");
        return;
    }

    try {
        const response = fetch(url);

        if (!response.ok) {
            throw new Error(`microCMSからのデータ取得に失敗しました: ${response.statusText}`);
        }

        const data = await response.json();
        const galleryItems = data.contents; // microCMSのcontents配列を想定

        if (!galleryItems || galleryItems.length === 0) {
            photoGridElement.innerHTML = '<p>表示する写真がありません。</p>';
            return;
        }

        let gridHTML = '';
        let modalHTML = '';

        galleryItems.forEach((item, index) => {
            // モーダルのIDを動的に生成
            const modalId = `modal-${index + 1}`; 
            
            // 💡 GCSのURLを構築: ベースURL + ファイル名
            // microCMSのjsonの構造が{"image": ファイル名,"title":コメント}であることを想定
            const imageFileName = item.image;
            const imageUrl = GCS_BASE_URL + imageFileName;
            const titleComment = item.comment;

            // ギャラリーアイテム (タイル) のHTMLを生成
            gridHTML += `
                <a href="#${modalId}" class="gallery-item">
                    <img src="${imageUrl}" alt="${titleComment}">
                </a>
            `;

            // モーダルウィンドウのHTMLを生成
            // 拡大画像とタイル画像は同じURLを使用
            modalHTML += `
                <div id="${modalId}" class="modal-window">
                    <a href="#" class="modal-overlay"></a>
                    <div class="modal-content">
                        <a href="#" class="modal-close-button">×</a>
                        <img src="${imageUrl}" alt="${titleComment}">
                        <p>${titleComment}</p>
                    </div>
                </div>
            `;
        });

        // 生成したHTMLをDOMに挿入
        photoGridElement.innerHTML = gridHTML;
        modalsContainerElement.innerHTML = modalHTML;

    } catch (error) {
        console.error('ギャラリーのロード中にエラーが発生しました:', error);
        photoGridElement.innerHTML = '<p>データの読み込み中にエラーが発生しました。</p>';
    }
}

// ページロード完了後にギャラリーをロード
document.addEventListener('DOMContentLoaded', loadGallery);