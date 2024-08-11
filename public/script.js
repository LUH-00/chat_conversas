// Importa as funções necessárias do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js';
import { getDatabase, ref, set, push, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCdhlAQGqagLho07r7sZ6a7M736lztnMyM",
    authDomain: "chat-de-conversas-1335c.firebaseapp.com",
    projectId: "chat-de-conversas-1335c",
    storageBucket: "chat-de-conversas-1335c.appspot.com",
    messagingSenderId: "623884587287",
    appId: "1:623884587287:web:57c369035488b4581ee752",
    measurementId: "G-DZ8ZG2VE1L"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const messagesRef = ref(database, 'messages');

// Envia uma mensagem para o banco de dados
document.getElementById('sendButton').addEventListener('click', function() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message !== '') {
        // Adiciona uma nova mensagem ao banco de dados
        const newMessageRef = push(messagesRef);
        set(newMessageRef, {
            message: message,
            timestamp: Date.now()
        });
        messageInput.value = '';
    }
});

// Recebe mensagens do banco de dados
onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    displayMessage(messageData.message);
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.classList.add('message', 'received'); // Adiciona classe para estilizar
    document.getElementById('messages').appendChild(messageElement);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}