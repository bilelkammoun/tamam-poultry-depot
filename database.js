/**
 * TAMAM POULTRY - Central Database & Logic
 * Handles localStorage persistence for articles, users, and movements.
 */

const DB = {
    // Keys
    ARTICLES: 'tamam_articles',
    USERS: 'tamam_users',
    MOVEMENTS: 'tamam_movements',
    SESSION: 'tamam_session',

    // --- Initialization ---
    init() {
        if (!localStorage.getItem(this.USERS)) {
            const initialUsers = [
                { id: 1, username: 'admin', password: '123', name: 'Administrateur', role: 'Admin' },
                { id: 2, username: 'magasin', password: '123', name: 'Magasinier 1', role: 'Magasinier' },
                { id: 3, username: 'tech', password: '123', name: 'Technicien 1', role: 'Technicien' }
            ];
            localStorage.setItem(this.USERS, JSON.stringify(initialUsers));
        }

        if (!localStorage.getItem(this.ARTICLES)) {
            const initialArticles = [
                { code: 'MOT-01', name: 'Moteur ABB 5.5kW', category: 'Moteurs', stock: 12, location: 'Rayon A-1', supplier: 'ABB', price: 150.50, unit: 'pce', lastUpdate: new Date().toISOString() },
                { code: 'RMT-6205', name: 'Roulement 6205', category: 'Mécanique', stock: 5, location: 'Armoire B', supplier: 'SKF', price: 12.00, unit: 'pce', lastUpdate: new Date().toISOString() }
            ];
            localStorage.setItem(this.ARTICLES, JSON.stringify(initialArticles));
        }

        if (!localStorage.getItem(this.MOVEMENTS)) {
            localStorage.setItem(this.MOVEMENTS, JSON.stringify([]));
        }
    },

    // --- Auth Logic ---
    login(username, password) {
        const users = JSON.parse(localStorage.getItem(this.USERS)) || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem(this.SESSION, JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout() {
        localStorage.removeItem(this.SESSION);
        window.location.href = 'index.html';
    },

    getSession() {
        return JSON.parse(localStorage.getItem(this.SESSION));
    },

    checkAuth() {
        const session = this.getSession();
        if (!session) {
            window.location.href = 'index.html';
        }
        return session;
    },

    // --- Articles Logic ---
    getArticles() {
        return JSON.parse(localStorage.getItem(this.ARTICLES)) || [];
    },

    saveArticle(article) {
        let articles = this.getArticles();
        const index = articles.findIndex(a => a.code === article.code);
        article.lastUpdate = new Date().toISOString();
        if (index > -1) {
            // Merge existing data with new data
            articles[index] = { ...articles[index], ...article };
        } else {
            articles.push(article);
        }
        localStorage.setItem(this.ARTICLES, JSON.stringify(articles));
    },

    deleteArticle(code) {
        let articles = this.getArticles();
        articles = articles.filter(a => a.code !== code);
        localStorage.setItem(this.ARTICLES, JSON.stringify(articles));
    },

    clearArticles() {
        localStorage.setItem(this.ARTICLES, JSON.stringify([]));
    },

    getTotalStockValue() {
        const articles = this.getArticles();
        return articles.reduce((total, article) => {
            return total + (article.stock * (article.price || 0));
        }, 0);
    },

    // --- Movements Logic ---
    getMovements() {
        return JSON.parse(localStorage.getItem(this.MOVEMENTS)) || [];
    },

    addMovement(movement) {
        const movements = this.getMovements();
        movement.date = new Date().toISOString();
        movements.unshift(movement); // Newest first
        localStorage.setItem(this.MOVEMENTS, JSON.stringify(movements));
    }
};

// Initialize on load
DB.init();
