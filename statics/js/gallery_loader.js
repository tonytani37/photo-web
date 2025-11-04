// --- 環境設定 ---
// ⚠️ 以下の定数をご自身の情報に置き換えてください
const MICROCMS_ENDPOINT = 'photo'; 
const GCS_BASE_URL = 'https://storage.googleapis.com/';

// microCMS APIのベースURL
const MICROCMS_BASE_URL = `https://t-cms-api-281456272382.asia-northeast2.run.app/api/v1/${MICROCMS_ENDPOINT}`; 
// const MICROCMS_BASE_URL = `http://localhost:8080/api/v1/${MICROCMS_ENDPOINT}`; 

// --- DOM要素の取得 ---
const photoGridElement = document.getElementById('photo-grid');
const modalsContainerElement = document.getElementById('modals-container');
// ページネーションコンテナのDOM要素
const paginationContainerElement = document.getElementById('pagination-controls'); //

// --- ページネーション設定 ---
const LIMIT = 10; // 1ページあたりの表示件数（11件以上で別ページという要件から10件を設定）

/**
 * ページネーションコントロールのHTMLを生成・表示する
 * @param {number} currentPage - 現在のページ番号 (1から始まる)
 * @param {number} totalCount - 全コンテンツ数
 */
function renderPagination(currentPage, totalCount) {
    if (!paginationContainerElement) return;

    const totalPages = Math.ceil(totalCount / LIMIT);
    if (totalPages <= 1) { // 1ページのみの場合は非表示
        paginationContainerElement.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Prevボタン
    paginationHTML += `<a href="?page=${currentPage - 1}" class="pagination-button ${currentPage === 1 ? 'disabled' : ''}">&laquo; 前へ</a>`; //

    // ページ番号ボタン
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage ? 'active' : '';
        paginationHTML += `<a href="?page=${i}" class="pagination-button ${isActive}">${i}</a>`; //
    }
    
    // Nextボタン
    paginationHTML += `<a href="?page=${currentPage + 1}" class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}">次へ &raquo;</a>`; //


    paginationContainerElement.innerHTML = `<div class="pagination-wrapper">${paginationHTML}</div>`;
}

/**
 * microCMSからギャラリーデータを取得し、HTMLを構築するメイン関数
 */
async function loadGallery() {
    if (!photoGridElement || !modalsContainerElement) {
        console.error("ギャラリー表示に必要なDOM要素が見つかりません。");
        return;
    }

    // URLから現在のページ番号を取得 (デフォルトは1ページ目)
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;
    const offset = (currentPage - 1) * LIMIT;

    // microCMS APIのURLを構築 (limitとoffsetを設定し、全件数も取得)
    // microCMSでは全件数取得のために fields=image,comment,id が必要
    // 管理画面の並び順に取得するためorders指定を行っている
    // const fetchUrl = `${MICROCMS_BASE_URL}?limit=${LIMIT}&offset=${offset}&orders=-createdAt&fields=image,comment,id`; //
    const fetchUrl = `${MICROCMS_BASE_URL}?limit=${LIMIT}&offset=${offset}&orders=customOrder&fields=image,comment,id`;
    
    try {
        const response = await fetch(fetchUrl);

        if (!response.ok) {
            throw new Error(`microCMSからのデータ取得に失敗しました: ${response.statusText}`);
        }

        const data = await response.json();
        const galleryItems = data.contents; 
        const totalCount = data.totalCount || galleryItems.length; // 全件数を取得

        // ページネーションの表示
        renderPagination(currentPage, totalCount);

        if (!galleryItems || galleryItems.length === 0) {
            photoGridElement.innerHTML = '<p>表示する写真がありません。</p>';
            return;
        }

        let gridHTML = '';
        let modalHTML = '';

        galleryItems.forEach((item, index) => {
            // モーダルのIDを動的に生成（ページをまたいでもユニークになるよう、オフセットを加味）
            const globalIndex = offset + index + 1;
            const modalId = `modal-${globalIndex}`; 
            
            // GCSのURLを構築: ベースURL + ファイル名
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
            // モーダルを閉じるときに現在のページに戻るよう、URLにcurrentPageを含める
            modalHTML += `
                <div id="${modalId}" class="modal-window">
                    <a href="#gallery?page=${currentPage}" class="modal-overlay"></a>
                    <div class="modal-content">
                        <a href="#gallery?page=${currentPage}" class="modal-close-button">×</a>
                        <img src="${imageUrl}" alt="${titleComment}">
                        <p>${titleComment}</p>
                    </div>
                </div>
            `;
        });

        // 生成したHTMLをDOMに挿入
        photoGridElement.innerHTML = gridHTML;
        modalsContainerElement.innerHTML = modalHTML;
        
        // ページのトップに戻る（任意）
        // window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('ギャラリーのロード中にエラーが発生しました:', error);
        photoGridElement.innerHTML = '<p>データの読み込み中にエラーが発生しました。</p>';
    }
}

// ページロード完了後にギャラリーをロード
document.addEventListener('DOMContentLoaded', loadGallery);