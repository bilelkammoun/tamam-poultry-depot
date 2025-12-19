document.addEventListener('DOMContentLoaded', () => {
    const speakBtn = document.getElementById('speak-btn');
    const textArea = document.getElementById('text-to-read');
    const statusMsg = document.getElementById('status-message');
    const languageSelect = document.getElementById('language-select');
    const voiceSelect = document.getElementById('voice-select');
    const compatibilityNotice = document.getElementById('compatibility-notice');
    const langLabel = document.getElementById('lang-label');
    const voiceLabel = document.getElementById('voice-label');
    const tamamBtn = document.getElementById('nav-tamam');
    const tamamBtnText = document.getElementById('tamam-btn-text');
    const usersBtn = document.getElementById('nav-users');
    const usersBtnText = document.getElementById('users-btn-text');

    const synth = window.speechSynthesis;
    let voices = [];

    /**
     * Translates messages based on active language
     */
    const getMessage = (key, lang) => {
        const messages = {
            'fr-FR': {
                'empty': 'Veuillez écrire un texte à lire',
                'speaking': 'Lecture en cours...',
                'btn': 'Lire le texte',
                'placeholder': 'Écrivez quelque chose ici...',
                'no-voice': '⚠️ <strong>Attention :</strong> Aucune voix française n\'est installée sur votre système.',
                'install-hint': 'Astuce : Installez un pack de langue dans les paramètres de votre PC (Windows/Mac/Android).',
                'lang-label': 'Langue :',
                'voice-label': 'Voix :',
                'tamam-btn': 'MAGASIN PDR',
                'users-btn': 'Utilisateurs'
            },
            'en-US': {
                'empty': 'Please write some text to read',
                'speaking': 'Speaking...',
                'btn': 'Speak text',
                'placeholder': 'Write something here...',
                'no-voice': '⚠️ <strong>Warning:</strong> No English voice detected on your system.',
                'install-hint': 'Try installing an English language pack in your OS settings.',
                'lang-label': 'Language:',
                'voice-label': 'Voice:',
                'tamam-btn': 'MAGASIN PDR',
                'users-btn': 'Users'
            },
            'ar-SA': {
                'empty': 'يرجى كتابة نص للقراءة',
                'speaking': 'جاري القراءة...',
                'btn': 'قراءة النص',
                'placeholder': 'اكتب شيئاً هنا...',
                'no-voice': '⚠️ <strong>تنبيه :</strong> لا يوجد صوت عربي مثبت على جهازك.',
                'install-hint': 'نصيحة: يرجى تثبيت حزمة اللغة العربية من إعدادات نظام التشغيل (Windows أو Android).',
                'lang-label': 'اللغة:',
                'voice-label': 'الصوت:',
                'tamam-btn': 'مخزن قطع الغيار',
                'users-btn': 'المستخدمين'
            }
        };
        return messages[lang][key];
    };

    /**
     * Populates the voice selector based on the selected language
     */
    const updateVoiceList = () => {
        const selectedLang = languageSelect.value;
        const langCode = selectedLang.split('-')[0];
        
        voices = synth.getVoices();
        
        // Filter voices matching the language code
        const filteredVoices = voices.filter(v => v.lang.startsWith(langCode));
        
        // Clear selector
        voiceSelect.innerHTML = '';
        
        if (filteredVoices.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = selectedLang === 'ar-SA' ? "لم يتم العثور على صوت" : (selectedLang === 'en-US' ? "No voices detected" : "Aucune voix détectée");
            voiceSelect.appendChild(opt);
            
            // Show compatibility warning
            compatibilityNotice.innerHTML = `${getMessage('no-voice', selectedLang)}<br><small>${getMessage('install-hint', selectedLang)}</small>`;
            compatibilityNotice.classList.remove('hidden');
        } else {
            compatibilityNotice.classList.add('hidden');
            
            filteredVoices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = voice.name;
                voiceSelect.appendChild(option);
            });
        }
    };

    // Chrome/Edge load voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = updateVoiceList;
    }

    /**
     * Updates context when language changes
     */
    const updateLanguageContext = () => {
        const lang = languageSelect.value;
        const root = document.querySelector('.glass-container');
        
        // Update document lang
        document.documentElement.lang = lang.split('-')[0];
        
        // Update RTL
        if (lang === 'ar-SA') {
            root.classList.add('rtl');
            textArea.classList.add('rtl');
        } else {
            root.classList.remove('rtl');
            textArea.classList.remove('rtl');
        }
        
        // Update labels
        langLabel.textContent = getMessage('lang-label', lang);
        voiceLabel.textContent = getMessage('voice-label', lang);
        tamamBtnText.textContent = getMessage('tamam-btn', lang);
        usersBtnText.textContent = getMessage('users-btn', lang);
        
        // Update placeholder
        textArea.placeholder = getMessage('placeholder', lang);
        
        // Update button
        speakBtn.querySelector('.text').textContent = getMessage('btn', lang);
        
        // Update voices
        updateVoiceList();
    };

    languageSelect.addEventListener('change', updateLanguageContext);

    /**
     * Execution
     */
    const speak = () => {
        statusMsg.textContent = '';
        statusMsg.classList.remove('warning');

        const text = textArea.value.trim();
        const lang = languageSelect.value;

        if (text === '') {
            statusMsg.textContent = getMessage('empty', lang);
            statusMsg.classList.add('warning');
            textArea.style.borderColor = 'var(--error-color)';
            setTimeout(() => textArea.style.borderColor = 'var(--glass-border)', 2000);
            return;
        }

        if (synth.speaking) synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select specific voice if available
        const selectedVoiceName = voiceSelect.value;
        if (selectedVoiceName) {
            const voice = voices.find(v => v.name === selectedVoiceName);
            if (voice) utterance.voice = voice;
        }
        
        utterance.lang = lang;

        utterance.onstart = () => {
            speakBtn.disabled = true;
            speakBtn.style.opacity = '0.7';
            speakBtn.querySelector('.text').textContent = getMessage('speaking', lang);
        };

        const resetBtn = () => {
            speakBtn.disabled = false;
            speakBtn.style.opacity = '1';
            speakBtn.querySelector('.text').textContent = getMessage('btn', lang);
        };

        utterance.onend = resetBtn;
        utterance.onerror = (e) => {
            console.error(e);
            resetBtn();
        };

        synth.speak(utterance);
    };

    speakBtn.addEventListener('click', speak);
    
    // Navigation
    tamamBtn.addEventListener('click', () => {
        window.location.href = 'inventory.html';
    });

    usersBtn.addEventListener('click', () => {
        window.location.href = 'users.html';
    });

    // Init
    setTimeout(updateLanguageContext, 100);
});
