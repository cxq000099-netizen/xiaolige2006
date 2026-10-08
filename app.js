const photos = Array.isArray(window.PHOTOS) ? window.PHOTOS : [];
const gallery = document.getElementById('gallery');
const empty = document.getElementById('empty');
const count = document.getElementById('photo-count');
const buttons = [...document.querySelectorAll('[data-category]')];
const dialog = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
let shown = [];
let selected = 0;
let activeCategory = 'all';
document.getElementById('year').textContent = new Date().getFullYear();
function render() {
  shown = photos.filter(photo => activeCategory === 'all' || photo.category === activeCategory);
  gallery.replaceChildren();
  count.textContent = String(shown.length).padStart(2, '0');
  empty.hidden = shown.length > 0;
  if (!shown.length) {
    empty.querySelector('.empty-label').textContent = photos.length ? '此分类暂无作品' : '作品整理中';
    empty.querySelector('h3').innerHTML = photos.length ? '换个分类，<br>继续看看。' : '下一张照片，<br>会从这里开始。';
    empty.querySelector('div > p:last-child').textContent = photos.length ? '其他作品正在持续整理。' : '人物、建筑、风景与人文作品将陆续呈现。';
    return;
  }
  shown.forEach((photo, index) => {
    const card = document.createElement('article');
    card.className = 'photo-card' + (photo.wide ? ' wide' : '');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', '查看照片：' + (photo.title || photo.category));
    const frame = document.createElement('span');
    frame.className = 'photo-frame';
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.alt || photo.title || photo.category;
    image.loading = index < 2 ? 'eager' : 'lazy';
    frame.append(image);
    const meta = document.createElement('span');
    meta.className = 'card-meta';
    const title = document.createElement('strong');
    title.textContent = photo.title || '无题';
    const category = document.createElement('span');
    category.textContent = photo.category;
    meta.append(title, category);
    button.append(frame, meta);
    button.addEventListener('click', () => openPhoto(index));
    card.append(button);
    gallery.append(card);
  });
}
function openPhoto(index) {
  selected = (index + shown.length) % shown.length;
  const photo = shown[selected];
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.alt || photo.title || photo.category;
  document.getElementById('lightbox-category').textContent = photo.category;
  document.getElementById('lightbox-title').textContent = photo.title || '无题';
  document.getElementById('lightbox-place').textContent = photo.place || '';
  if (!dialog.open) dialog.showModal();
  document.getElementById('prev-photo').hidden = shown.length < 2;
  document.getElementById('next-photo').hidden = shown.length < 2;
}
buttons.forEach(button => button.addEventListener('click', () => {
  activeCategory = button.dataset.category;
  buttons.forEach(item => {
    const isActive = item === button;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-pressed', String(isActive));
  });
  render();
}));
document.getElementById('close-lightbox').addEventListener('click', () => dialog.close());
document.getElementById('prev-photo').addEventListener('click', () => openPhoto(selected - 1));
document.getElementById('next-photo').addEventListener('click', () => openPhoto(selected + 1));
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' && shown.length > 1) openPhoto(selected - 1);
  if (event.key === 'ArrowRight' && shown.length > 1) openPhoto(selected + 1);
});
render();
