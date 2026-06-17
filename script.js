// Dom Elements Mapped
const bookForm = document.querySelector('#book-form');
const booksContainer = document.querySelector('#books-container');
const stars = document.querySelectorAll('.star');
const statusButtons = document.querySelectorAll('.status-btn');
const synopsisTextarea = document.querySelector('#book-synopsis');
const searchInput = document.querySelector('#search-book');
const counterCards = document.querySelectorAll('.counter-card');

// Modais
const modal = document.querySelector('#book-modal');
const alertModal = document.querySelector('#alert-modal');
const modalTitle = document.querySelector('#modal-title');
const btnSubmitForm = document.querySelector('#btn-submit-form');
const alertModalMessage = document.querySelector('#alert-modal-message');

// Variáveis de Estado Unificadas
let selectedRating = 0;
let selectedStatus = 'not-started'; 
let currentFilter = 'all'; 
let editId = null; 
let books = []; 

// Inicialização Inteligente
(() => {
    const saved = localStorage.getItem('readboxd_books');
    if (saved) books = JSON.parse(saved);
    updateStatusSelection(selectedStatus);
    renderBooks();
})();

function saveToStorage() {
    localStorage.setItem('readboxd_books', JSON.stringify(books));
}

// Redimensionamento do Textarea Otimizado
synopsisTextarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = `${this.scrollHeight}px`;
});

// Manipulador das Estrelas Integrado
stars.forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating));
    });
});

// Seleção de Status Otimizada
statusButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedStatus = button.dataset.status;
        updateStatusSelection(selectedStatus);
    });
});

function updateStatusSelection(status) {
    statusButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.status === status));
}

// Listeners de Controle do Modal
document.querySelector('#btn-open-modal').addEventListener('click', () => {
    modalTitle.textContent = 'Adicionar Novo Livro';
    btnSubmitForm.textContent = 'Adicionar Livro';
    editId = null; 
    bookForm.reset();
    resetFormState();
    modal.classList.add('active');
});

document.querySelector('#btn-close-modal').addEventListener('click', () => modal.classList.remove('active'));
document.querySelector('#btn-close-alert').addEventListener('click', () => alertModal.classList.remove('active'));

[modal, alertModal].forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); });
});

function resetFormState() {
    synopsisTextarea.style.height = 'auto';
    selectedRating = 0;
    selectedStatus = 'not-started';
    updateStatusSelection(selectedStatus);
    stars.forEach(s => s.classList.remove('active'));
}

// Filtros Superiores
counterCards.forEach(card => {
    card.addEventListener('click', () => {
        counterCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentFilter = card.dataset.filter;
        renderBooks();
    });
});

searchInput.addEventListener('input', renderBooks);

// Atualização de Contadores de Estado
function updateCounters() {
    const total = books.length;
    const completed = books.filter(b => b.status === 'completed').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const notStarted = books.filter(b => b.status === 'not-started').length;

    document.querySelector('#count-total').textContent = total;
    document.querySelector('#count-completed').textContent = completed;
    document.querySelector('#count-reading').textContent = reading;
    document.querySelector('#count-not-started').textContent = notStarted;
}

// Validação e Cadastro Resumidos
bookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.querySelector('#book-title').value.trim();
    const author = document.querySelector('#book-author').value.trim();
    const synopsis = synopsisTextarea.value || 'Sem sinopse disponível.';
    const coverUrl = document.querySelector('#book-cover').value;

    const isDuplicate = books.some(b => b.title.toLowerCase() === title.toLowerCase() && b.id !== editId);

    if (isDuplicate) {
        alertModalMessage.textContent = `O livro "${title}" já está cadastrado na sua biblioteca!`;
        alertModal.classList.add('active');
        return; 
    }

    if (editId !== null) {
        books = books.map(b => b.id === editId ? { ...b, title, author, synopsis, coverUrl, status: selectedStatus, rating: selectedRating } : b);
        editId = null;
    } else {
        books.push({ id: Date.now().toString(), title, author, synopsis, coverUrl, status: selectedStatus, rating: selectedRating });
    }

    saveToStorage();
    renderBooks();
    modal.classList.remove('active');
    bookForm.reset();
    resetFormState();
});

// Renderizador Funcional de Elementos da Tela
function renderBooks() {
    booksContainer.innerHTML = ''; 
    const query = searchInput.value.toLowerCase().trim();

    books.forEach(book => {
        if (currentFilter !== 'all' && book.status !== currentFilter) return;
        if (query && !book.title.toLowerCase().includes(query)) return;

        const card = document.createElement('article');
        card.classList.add('book-card');

        const starsStr = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
        const labelText = book.status === 'completed' ? 'Lido' : book.status === 'reading' ? 'Em Andamento' : 'Não Lido';

        const isLong = book.synopsis.length > 100;
        const shortSynopsis = isLong ? `${book.synopsis.substring(0, 100)}...` : book.synopsis;

        card.innerHTML = `
            <img src="${book.coverUrl}" alt="Capa">
            <span class="status-badge badge-${book.status}">${labelText}</span>
            <h3>${book.title}</h3>
            <p class="author">Por: ${book.author}</p>
            <p class="synopsis">${shortSynopsis}</p>
            ${isLong ? '<button class="btn-toggle-synopsis">Ver mais</button>' : ''}
            <p class="rating-result">${starsStr}</p>
            <div class="card-actions">
                <button class="btn-edit">Editar</button>
                <button class="btn-delete">Remover</button>
            </div>
        `;

        if (isLong) {
            const btnToggle = card.querySelector('.btn-toggle-synopsis');
            const pSynopsis = card.querySelector('.synopsis');
            btnToggle.addEventListener('click', () => {
                const isOpen = btnToggle.textContent === 'Ver mais';
                pSynopsis.textContent = isOpen ? book.synopsis : shortSynopsis;
                btnToggle.textContent = isOpen ? 'Ver menos' : 'Ver mais';
            });
        }

        card.querySelector('.btn-delete').addEventListener('click', () => {
            books = books.filter(b => b.id !== book.id);
            saveToStorage();
            renderBooks();
        });

        card.querySelector('.btn-edit').addEventListener('click', () => {
            modalTitle.textContent = 'Editar Livro';
            btnSubmitForm.textContent = 'Salvar Alterações';
            editId = book.id;

            document.querySelector('#book-title').value = book.title;
            document.querySelector('#book-author').value = book.author;
            synopsisTextarea.value = book.synopsis;
            document.querySelector('#book-cover').value = book.coverUrl;
            
            synopsisTextarea.style.height = `${synopsisTextarea.scrollHeight}px`;
            selectedStatus = book.status;
            updateStatusSelection(selectedStatus);
            
            selectedRating = book.rating;
            stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating));
            modal.classList.add('active');
        });

        booksContainer.appendChild(card);
    });

    updateCounters();
}
