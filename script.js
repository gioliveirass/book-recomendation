// Substitua pela URL do seu Web App do Google Apps Script após o deploy
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzolyC9hm5nJ9yeCpXG3D8liTltlA1lrgFh3bkXba3F0z6qm4DEJV6Y7uHv9WwqjUy6/exec';

const DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

const form = document.getElementById('recommendation-form');
const searchInput = document.getElementById('book-search');
const searchResults = document.getElementById('search-results');
const searchLoading = document.getElementById('search-loading');
const searchError = document.getElementById('search-error');
const searchContainer = document.getElementById('search-container');
const selectedBookEl = document.getElementById('selected-book');
const selectedCover = document.getElementById('selected-cover');
const selectedTitle = document.getElementById('selected-title');
const selectedAuthors = document.getElementById('selected-authors');
const clearSelectionBtn = document.getElementById('clear-selection');
const ondeComprarInput = document.getElementById('onde-comprar');
const submitBtn = document.getElementById('submit-btn');
const formMessage = document.getElementById('form-message');

let selectedBook = null;
let debounceTimer = null;
let activeRequest = null;
let highlightedIndex = -1;
let isSelectingFromList = false;

function hideMessage() {
  formMessage.hidden = true;
  formMessage.textContent = '';
  formMessage.className = 'message';
}

function showMessage(text, type) {
  formMessage.hidden = false;
  formMessage.textContent = text;
  formMessage.className = `message message--${type}`;
}

function showSearchError(text) {
  searchError.hidden = false;
  searchError.textContent = text;
}

function hideSearchError() {
  searchError.hidden = true;
  searchError.textContent = '';
}

function setLoading(isLoading) {
  searchLoading.hidden = !isLoading;
}

function closeResults() {
  searchResults.hidden = true;
  searchResults.innerHTML = '';
  searchInput.setAttribute('aria-expanded', 'false');
  highlightedIndex = -1;
}

function openResults() {
  searchResults.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
}

function parseBook(item) {
  const info = item.volumeInfo || {};
  const authors = Array.isArray(info.authors) ? info.authors.join(', ') : 'Autor desconhecido';
  const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';

  return {
    titulo: info.title || 'Sem título',
    autores: authors,
    capa: cover.replace('http://', 'https://'),
    googleBooksId: item.id,
  };
}

function createCoverElement(src, alt, className) {
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = className;
    img.loading = 'lazy';
    img.onerror = () => {
      const placeholder = document.createElement('div');
      placeholder.className = `${className} ${className}--placeholder`;
      placeholder.textContent = '📖';
      placeholder.setAttribute('aria-hidden', 'true');
      img.replaceWith(placeholder);
    };
    return img;
  }

  const placeholder = document.createElement('div');
  placeholder.className = `${className} ${className}--placeholder`;
  placeholder.textContent = '📖';
  placeholder.setAttribute('aria-hidden', 'true');
  return placeholder;
}

function renderResults(books) {
  searchResults.innerHTML = '';

  if (books.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'search__empty';
    empty.textContent = 'Nenhum livro encontrado. Tente outro termo.';
    searchResults.appendChild(empty);
    openResults();
    return;
  }

  books.forEach((book, index) => {
    const li = document.createElement('li');
    li.className = 'search__result';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.index = String(index);

    const cover = createCoverElement(book.capa, `Capa de ${book.titulo}`, 'search__result-cover');

    const info = document.createElement('div');
    info.className = 'search__result-info';

    const title = document.createElement('div');
    title.className = 'search__result-title';
    title.textContent = book.titulo;

    const authors = document.createElement('div');
    authors.className = 'search__result-authors';
    authors.textContent = book.autores;

    info.append(title, authors);
    li.append(cover, info);

    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isSelectingFromList = true;
      selectBook(book);
      isSelectingFromList = false;
    });

    searchResults.appendChild(li);
  });

  openResults();
}

async function searchBooks(query) {
  if (activeRequest) {
    activeRequest.abort();
  }

  const controller = new AbortController();
  activeRequest = controller;

  setLoading(true);
  hideSearchError();

  try {
    const url = `${BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=pt`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error('Erro ao buscar livros. Tente novamente.');
    }

    const data = await response.json();
    const books = (data.items || []).map(parseBook);
    renderResults(books);
  } catch (err) {
    if (err.name === 'AbortError') return;
    closeResults();
    showSearchError('Não foi possível buscar livros. Verifique sua conexão.');
  } finally {
    if (activeRequest === controller) {
      activeRequest = null;
      setLoading(false);
    }
  }
}

function handleSearchInput() {
  if (selectedBook) return;

  const query = searchInput.value.trim();
  clearTimeout(debounceTimer);

  if (query.length < MIN_SEARCH_LENGTH) {
    closeResults();
    setLoading(false);
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }
    return;
  }

  debounceTimer = setTimeout(() => searchBooks(query), DEBOUNCE_MS);
}

function selectBook(book) {
  selectedBook = book;
  searchInput.value = book.titulo;
  searchInput.disabled = true;
  closeResults();
  hideSearchError();

  selectedCover.src = book.capa || '';
  selectedCover.alt = `Capa de ${book.titulo}`;
  selectedCover.onerror = () => {
    selectedCover.style.display = 'none';
  };
  selectedCover.style.display = book.capa ? '' : 'none';

  selectedTitle.textContent = book.titulo;
  selectedAuthors.textContent = book.autores;
  selectedBookEl.hidden = false;

  submitBtn.disabled = false;
}

function clearSelection() {
  selectedBook = null;
  searchInput.value = '';
  searchInput.disabled = false;
  searchInput.focus();
  selectedBookEl.hidden = true;
  selectedCover.src = '';
  selectedCover.style.display = '';
  submitBtn.disabled = true;
  closeResults();
  hideSearchError();
  hideMessage();
}

function highlightResult(index) {
  const items = searchResults.querySelectorAll('.search__result');
  items.forEach((item, i) => {
    item.setAttribute('aria-selected', i === index ? 'true' : 'false');
  });
  highlightedIndex = index;

  if (items[index]) {
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

function handleSearchKeydown(e) {
  if (searchResults.hidden) return;

  const items = searchResults.querySelectorAll('.search__result');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0;
    highlightResult(next);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1;
    highlightResult(prev);
  } else if (e.key === 'Enter' && highlightedIndex >= 0) {
    e.preventDefault();
    items[highlightedIndex].dispatchEvent(new MouseEvent('mousedown'));
  } else if (e.key === 'Escape') {
    closeResults();
  }
}

function handleClickOutside(e) {
  if (!searchContainer.contains(e.target)) {
    closeResults();
  }
}

function formatDateBR() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

async function handleSubmit(e) {
  e.preventDefault();
  hideMessage();

  if (!selectedBook) {
    showSearchError('Selecione um livro da lista de sugestões.');
    searchInput.focus();
    return;
  }

  if (APPS_SCRIPT_URL === 'COLOQUE_SUA_URL_DO_APPS_SCRIPT_AQUI') {
    showMessage('Configure a URL do Google Apps Script no arquivo script.js antes de enviar.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add('form__submit--loading');

  const payload = {
    titulo: selectedBook.titulo,
    autores: selectedBook.autores,
    capa: selectedBook.capa,
    googleBooksId: selectedBook.googleBooksId,
    ondeComprar: ondeComprarInput.value.trim(),
    dataEnvio: formatDateBR(),
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    // no-cors não permite ler a resposta, mas o envio ocorre
    showMessage('Recomendação enviada com sucesso! Obrigada por compartilhar com o clube.', 'success');
    clearSelection();
    ondeComprarInput.value = '';
  } catch {
    showMessage('Erro ao enviar a recomendação. Tente novamente em alguns instantes.', 'error');
    submitBtn.disabled = false;
  } finally {
    submitBtn.classList.remove('form__submit--loading');
  }
}

searchInput.addEventListener('input', handleSearchInput);
searchInput.addEventListener('keydown', handleSearchKeydown);
searchInput.addEventListener('blur', () => {
  setTimeout(() => {
    if (isSelectingFromList || selectedBook) return;
    if (searchInput.value.trim()) {
      searchInput.value = '';
      closeResults();
      showSearchError('Selecione um livro da lista — não é possível digitar manualmente.');
    }
  }, 150);
});
clearSelectionBtn.addEventListener('click', clearSelection);
form.addEventListener('submit', handleSubmit);
document.addEventListener('click', handleClickOutside);
