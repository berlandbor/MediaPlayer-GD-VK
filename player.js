function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const vk_oid = getQueryParam('vk_oid');
const vk_id = getQueryParam('vk_id');
const vk_hash = getQueryParam('vk_hash');
const fileId = getQueryParam('id');
const streamUrl = getQueryParam('url');

const titleFromUrl = getQueryParam("title");
const posterFromUrl = getQueryParam("poster");
const categoryFromUrl = getQueryParam("category");
const descriptionFromUrl = getQueryParam("description");

const mediaTitle = document.getElementById('mediaTitle');
const mediaCategory = document.getElementById('mediaCategory');
const mediaPoster = document.getElementById('mediaPoster');
const mediaDescription = document.getElementById('mediaDescription');
const playerContainer = document.getElementById('player-container');
const streamError = document.getElementById("streamError");

const STORAGE_KEY = "universal_playlist";

function findMediaInPlaylist() {
  let playlist = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) playlist = JSON.parse(stored);
  } catch {}
  // VK
  if (vk_oid && vk_id && vk_hash) {
    return playlist.find(item =>
      String(item.vk_oid) === String(vk_oid) &&
      String(item.vk_id) === String(vk_id) &&
      String(item.vk_hash) === String(vk_hash)
    );
  }
  // Google Drive
  if (fileId) {
    return playlist.find(item => String(item.id) === String(fileId));
  }
  // Stream
  if (streamUrl) {
    return playlist.find(item => String(item.url) === String(streamUrl));
  }
  return null;
}

function renderPlayer() {
  let type = null, url = null, poster = "", title = "", cat = "", desc = "";
  let media = findMediaInPlaylist();

  // VK
  if (vk_oid && vk_id && vk_hash) {
    type = "vk";
    url = `https://vk.com/video_ext.php?oid=${vk_oid}&id=${vk_id}&hash=${vk_hash}`;
    if (media) {
      title = media.title || "Без названия";
      cat = media.category || "Без категории";
      poster = media.poster || "https://vk.com/images/video_placeholder.png";
      desc = media.description || "";
    } else {
      title = titleFromUrl || "VK-видео";
      cat = categoryFromUrl || "Без категории";
      poster = posterFromUrl || "https://vk.com/images/video_placeholder.png";
      desc = descriptionFromUrl || "";
    }
    playerContainer.innerHTML = `
      <div class="video-responsive">
        <iframe src="${url}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </div>`;
  }
  // Google Drive
  else if (fileId) {
    type = "gd";
    url = `https://drive.google.com/file/d/${fileId}/preview`;
    if (media) {
      title = media.title || "Без названия";
      cat = media.category || "Без категории";
      poster = media.poster || `https://drive.google.com/thumbnail?id=${fileId}`;
      desc = media.description || "";
    } else {
      title = titleFromUrl || "Видео Google Drive";
      cat = categoryFromUrl || "Без категории";
      poster = posterFromUrl || `https://drive.google.com/thumbnail?id=${fileId}`;
      desc = descriptionFromUrl || "";
    }
    playerContainer.innerHTML = `
      <div class="video-responsive">
        <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
      </div>`;
  }
  // Stream (radio/tv)
  else if (streamUrl) {
    type = "stream";
    url = streamUrl;
    if (media) {
      title = media.title || "Поток";
      cat = media.category || "Поток";
      poster = media.poster || "";
      desc = media.description || "";
    } else {
      title = titleFromUrl || "Поток";
      cat = categoryFromUrl || "Поток";
      poster = posterFromUrl || "";
      desc = descriptionFromUrl || "";
    }
    // Определяем тип: аудио/видео/m3u8
    let content = "";
    if (url.endsWith('.mp3') || url.endsWith('.aac') || url.endsWith('.ogg') || url.endsWith('.wav')) {
      content = `<audio controls autoplay src="${url}" style="width:100%;max-width:520px;background:#000;"></audio>`;
    } else if (url.endsWith('.m3u8')) {
      content = `<video controls autoplay src="${url}" style="width:100%;max-width:720px;background:#000;" poster="${poster}"></video>
      <div style="color:#fff;font-size:0.95em;margin-top:8px;">
      <b>Внимание:</b> Если поток не играет, попробуйте открыть в мобильном Chrome или Safari. Для полной поддержки .m3u8 используйте VLC или плееры с поддержкой HLS.
      </div>`;
    } else {
      content = `<iframe src="${url}" frameborder="0" allowfullscreen style="width:100%;min-height:360px;background:#000;"></iframe>`;
    }
    playerContainer.innerHTML = `<div class="video-responsive">${content}</div>`;
    // Проверка загрузки потока
    setTimeout(() => {
      // Примитивная проверка для iframe/video/audio
      const players = playerContainer.querySelectorAll("video,audio,iframe");
      let hasError = false;
      players.forEach(el => {
        el.onerror = () => { hasError = true; streamError.style.display = "block"; };
        el.onstalled = () => { hasError = true; streamError.style.display = "block"; };
      });
      if (!players.length) streamError.style.display = "block";
    }, 7000);
  }
  else {
    playerContainer.innerHTML = "<p>❌ Ошибка: медиа не выбрано</p>";
    title = "Ошибка";
    poster = "";
    cat = "";
    desc = "";
  }

  // Отрисовка инфо
  mediaTitle.textContent = title;
  mediaCategory.textContent = cat;
  mediaPoster.src = poster;
  mediaDescription.textContent = desc;
}

renderPlayer();