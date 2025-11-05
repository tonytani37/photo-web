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
const paginationContainerElement = document.getElementById('pagination-controls');

// --- ページネーション設定 ---
const LIMIT = 10; // 1ページあたりの表示件数

// グローバル変数として現在のページとトータルカウントを保持
let currentGalleryPage = 1;
let totalGalleryCount = 0;
let allGalleryItems = []; // 全ページのデータをキャッシュ

/**
 * ページネーションコントロールのHTMLを生成・表示する
 * @param {number} currentPage - 現在のページ番号 (1から始まる)
 * @param {number} totalCount - 全コンテンツ数
 */
function renderPagination(currentPage, totalCount) {
    if (!paginationContainerElement) return;

    const totalPages = Math.ceil(totalCount / LIMIT);
    if (totalPages <= 1) {
        paginationContainerElement.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Prevボタン
    paginationHTML += `<a href="?page=${currentPage - 1}" class="pagination-button ${currentPage === 1 ? 'disabled' : ''}">&laquo; 前へ</a>`;

    // ページ番号ボタン
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage ? 'active' : '';
        paginationHTML += `<a href="?page=${i}" class="pagination-button ${isActive}">${i}</a>`;
    }
    
    // Nextボタン
    paginationHTML += `<a href="?page=${currentPage + 1}" class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}">次へ &raquo;</a>`;

    paginationContainerElement.innerHTML = `<div class="pagination-wrapper">${paginationHTML}</div>`;
}

/**
 * 全データを取得してキャッシュする
 */
async function fetchAllGalleryData() {
    try {
        // まず総数を取得
        const countUrl = `${MICROCMS_BASE_URL}?limit=1&fields=id`;
        const countResponse = await fetch(countUrl);
        if (!countResponse.ok) {
            throw new Error(`データ取得に失敗しました: ${countResponse.statusText}`);
        }
        const countData = await countResponse.json();
        totalGalleryCount = countData.totalCount;

        // 全データを取得
        const allDataUrl = `${MICROCMS_BASE_URL}?limit=${totalGalleryCount}&orders=customOrder&fields=image,comment,id`;
        const allDataResponse = await fetch(allDataUrl);
        if (!allDataResponse.ok) {
            throw new Error(`全データ取得に失敗しました: ${allDataResponse.statusText}`);
        }
        const allData = await allDataResponse.json();
        allGalleryItems = allData.contents;
        
        return true;
    } catch (error) {
        console.error('全データの取得中にエラーが発生しました:', error);
        return false;
    }
}

/**
 * 全モーダルを生成（ページをまたいだナビゲーション用）
 */
function renderAllModals() {
    if (!modalsContainerElement || allGalleryItems.length === 0) return;

    let modalHTML = '';

    allGalleryItems.forEach((item, index) => {
        const globalIndex = index + 1;
        const modalId = `modal-${globalIndex}`;
        
        const imageFileName = item.image;
        const imageUrl = GCS_BASE_URL + imageFileName;
        const titleComment = item.comment;

        // 前後の写真のインデックスを計算
        const hasPrev = globalIndex > 1;
        const hasNext = globalIndex < totalGalleryCount;

        // 現在の写真が何ページ目にあるかを計算
        const itemPage = Math.ceil(globalIndex / LIMIT);

        // モーダルウィンドウのHTMLを生成（前後ボタン付き）
        modalHTML += `
            <div id="${modalId}" class="modal-window">
                <a href="#gallery?page=${itemPage}" class="modal-overlay"></a>
                <div class="modal-content">
                    <a href="#gallery?page=${itemPage}" class="modal-close-button">×</a>
                    
                    ${hasPrev ? `<a href="#modal-${globalIndex - 1}" class="modal-nav-button modal-prev-button" title="前の写真">&#8249;</a>` : ''}
                    ${hasNext ? `<a href="#modal-${globalIndex + 1}" class="modal-nav-button modal-next-button" title="次の写真">&#8250;</a>` : ''}
                    
                    <img src="${imageUrl}" alt="${titleComment}">
                    <p>${titleComment}</p>
                </div>
            </div>
        `;
    });

    modalsContainerElement.innerHTML = modalHTML;
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
    currentGalleryPage = parseInt(urlParams.get('page')) || 1;

    try {
        // 初回のみ全データを取得
        if (allGalleryItems.length === 0) {
            const success = await fetchAllGalleryData();
            if (!success) {
                photoGridElement.innerHTML = '<p>データの読み込み中にエラーが発生しました。</p>';
                return;
            }
            // 全モーダルを一度に生成
            renderAllModals();
        }

        // ページネーションの表示
        renderPagination(currentGalleryPage, totalGalleryCount);

        // 現在のページのアイテムを抽出
        const offset = (currentGalleryPage - 1) * LIMIT;
        const galleryItems = allGalleryItems.slice(offset, offset + LIMIT);

        if (!galleryItems || galleryItems.length === 0) {
            photoGridElement.innerHTML = '<p>表示する写真がありません。</p>';
            return;
        }

        let gridHTML = '';

        galleryItems.forEach((item, index) => {
            const globalIndex = offset + index + 1;
            const modalId = `modal-${globalIndex}`; 
            
            const imageFileName = item.image;
            const imageUrl = GCS_BASE_URL + imageFileName;
            const titleComment = item.comment;

            // ギャラリーアイテム (タイル) のHTMLを生成
            gridHTML += `
                <a href="#${modalId}" class="gallery-item">
                    <img src="${imageUrl}" alt="${titleComment}">
                </a>
            `;
        });

        // 生成したHTMLをDOMに挿入
        photoGridElement.innerHTML = gridHTML;
        
        // キーボードナビゲーションのイベントリスナーを設定
        setupKeyboardNavigation();

    } catch (error) {
        console.error('ギャラリーのロード中にエラーが発生しました:', error);
        photoGridElement.innerHTML = '<p>データの読み込み中にエラーが発生しました。</p>';
    }
}

/**
 * キーボードナビゲーション（左右矢印キー）の設定
 */
function setupKeyboardNavigation() {
    // 既存のリスナーを削除して重複を防ぐ
    document.removeEventListener('keydown', handleKeyNavigation);
    document.addEventListener('keydown', handleKeyNavigation);
}

function handleKeyNavigation(e) {
    // モーダルが開いているかチェック
    const currentHash = window.location.hash;
    if (!currentHash.startsWith('#modal-')) return;

    const currentModalId = parseInt(currentHash.replace('#modal-', ''));

    if (e.key === 'ArrowLeft' && currentModalId > 1) {
        // 左矢印：前の写真へ
        window.location.hash = `#modal-${currentModalId - 1}`;
    } else if (e.key === 'ArrowRight' && currentModalId < totalGalleryCount) {
        // 右矢印：次の写真へ
        window.location.hash = `#modal-${currentModalId + 1}`;
    } else if (e.key === 'Escape') {
        // Escキー：モーダルを閉じる
        const itemPage = Math.ceil(currentModalId / LIMIT);
        window.location.hash = `#gallery?page=${itemPage}`;
    }
}

// ページロード完了後にギャラリーをロード
document.addEventListener('DOMContentLoaded', loadGallery);

// ページ遷移時にもギャラリーを更新（ブラウザの戻る/進むボタン対応）
window.addEventListener('popstate', loadGallery);