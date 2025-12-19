/**
 * TAMAM POULTRY - Central Database & Logic
 * Firebase Firestore integration for real-time synchronization
 */

// Firebase configuration (replace with your project config)
const firebaseConfig = {
    apiKey: "AIzaSyB-1QjtXO8oLjaQvqZHKNjadhUW6Ks4SNE",
    authDomain: "tamam-poultry-depot.firebaseapp.com",
    projectId: "tamam-poultry-depot",
    storageBucket: "tamam-poultry-depot.firebasestorage.app",
    messagingSenderId: "324510421642",
    appId: "1:324510421642:web:d6bcf45f07f0c0d9315373",
    measurementId: "G-KS12K7VB3J"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Keys (now Firestore collections)
const DB = {
    ARTICLES: 'articles',
    USERS: 'users',
    MOVEMENTS: 'movements',
    SESSION: 'session',

    // --- Initialization ---
    async init() {
        // No need for localStorage init, data comes from Firestore
        console.log('Firebase initialized');
    },

    // --- Auth Logic ---
    async login(username, password) {
        try {
            const usersRef = db.collection(this.USERS);
            const snapshot = await usersRef.where('username', '==', username).where('password', '==', password).get();
            
            if (!snapshot.empty) {
                const user = snapshot.docs[0].data();
                user.id = snapshot.docs[0].id;
                localStorage.setItem(this.SESSION, JSON.stringify(user)); // Keep session local
                return user;
            }
            return null;
        } catch (error) {
            console.error('Login error:', error);
            return null;
        }
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

    // --- User Management ---
    async getUsers() {
        try {
            const snapshot = await db.collection(this.USERS).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get users error:', error);
            return [];
        }
    },

    async saveUser(user) {
        try {
            await db.collection(this.USERS).add(user);
        } catch (error) {
            console.error('Save user error:', error);
        }
    },

    async updateUser(id, updates) {
        try {
            await db.collection(this.USERS).doc(id).update(updates);
        } catch (error) {
            console.error('Update user error:', error);
        }
    },

    async deleteUser(id) {
        try {
            await db.collection(this.USERS).doc(id).delete();
        } catch (error) {
            console.error('Delete user error:', error);
        }
    },

    // --- Articles Logic ---
    async getArticles() {
        try {
            const snapshot = await db.collection(this.ARTICLES).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get articles error:', error);
            return [];
        }
    },

    async saveArticle(article) {
        try {
            const articlesRef = db.collection(this.ARTICLES);
            const existing = await articlesRef.where('code', '==', article.code).get();
            
            article.lastUpdate = new Date().toISOString();
            
            if (!existing.empty) {
                // Update existing
                await articlesRef.doc(existing.docs[0].id).update(article);
            } else {
                // Add new
                await articlesRef.add(article);
            }
        } catch (error) {
            console.error('Save article error:', error);
        }
    },

    async deleteArticle(code) {
        try {
            const articlesRef = db.collection(this.ARTICLES);
            const snapshot = await articlesRef.where('code', '==', code).get();
            if (!snapshot.empty) {
                await articlesRef.doc(snapshot.docs[0].id).delete();
            }
        } catch (error) {
            console.error('Delete article error:', error);
        }
    },

    async clearArticles() {
        try {
            const snapshot = await db.collection(this.ARTICLES).get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } catch (error) {
            console.error('Clear articles error:', error);
        }
    },

    async getTotalStockValue() {
        try {
            const articles = await this.getArticles();
            return articles.reduce((total, article) => {
                return total + (article.stock * (article.price || 0));
            }, 0);
        } catch (error) {
            console.error('Get total stock value error:', error);
            return 0;
        }
    },

    // --- Movements Logic ---
    async getMovements() {
        try {
            const snapshot = await db.collection(this.MOVEMENTS).orderBy('date', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get movements error:', error);
            return [];
        }
    },

    async addMovement(movement) {
        try {
            movement.date = new Date().toISOString();
            await db.collection(this.MOVEMENTS).add(movement);
        } catch (error) {
            console.error('Add movement error:', error);
        }
    }
};

// Initialize on load
DB.init();
