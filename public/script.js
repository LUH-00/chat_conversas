
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js';
import { getDatabase, ref, set, push, onChildAdded, onValue } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-storage.js';

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
const storage = getStorage(app);
const messagesRef = ref(database, 'messages');
const usersRef = ref(database, 'users');

// Variáveis para nome e foto do usuário
let currentUserId = 'user1';
let currentUserName = localStorage.getItem('currentUserName') || 'Usuário';
let currentUserPhoto = localStorage.getItem('currentUserPhoto') || '';

// Variável para rastrear a conversa atual
let currentConversationId = 'todos'; // 'todos' ou um ID de usuário específico

// Atualiza o ícone do perfil se a foto já estiver salva
const profileIcon = document.getElementById('profileIcon');
if (currentUserPhoto) {
    profileIcon.src = currentUserPhoto;
}

document.getElementById('profileButton').addEventListener('click', function() {
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    profileModal.show();
});

document.getElementById('profileForm').addEventListener('submit', function(event) {
    event.preventDefault();
    currentUserName = document.getElementById('userName').value.trim();
    const userPhotoInput = document.getElementById('userPhoto');
    if (userPhotoInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUserPhoto = e.target.result;
            profileIcon.src = currentUserPhoto;
            localStorage.setItem('currentUserPhoto', currentUserPhoto);
        };
        reader.readAsDataURL(userPhotoInput.files[0]);
    }
    localStorage.setItem('currentUserName', currentUserName);

    // Atualiza o Firebase com as informações do usuário
    set(ref(database, `users/${currentUserId}`), {
        userName: currentUserName,
        userPhoto: currentUserPhoto
    });

    // Atualiza a lista de usuários
    updateUserList();

    const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
    profileModal.hide();
});

// Atualiza a lista de usuários ativos
function updateUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    // Adiciona o item "Todos"
    const allUsersItem = document.createElement('li');
    allUsersItem.classList.add('list-group-item');
    allUsersItem.innerHTML = `<img src="img/logo.png" alt="Todos" class="rounded-circle me-2" height="40">
                            <span class="font-weight-bold">Todos</span>`;
    allUsersItem.addEventListener('click', () => startConversation('todos'));
    userList.appendChild(allUsersItem);

    // Adiciona o próprio usuário
    const currentUserItem = document.createElement('li');
    currentUserItem.classList.add('list-group-item');
    currentUserItem.innerHTML = `<img src="${currentUserPhoto || 'default-profile.png'}" alt="${currentUserName}" class="rounded-circle me-2" height="40">
                                <span class="font-weight-bold">${currentUserName}</span>`;
    currentUserItem.addEventListener('click', () => startConversation(currentUserId));
    userList.appendChild(currentUserItem);

    // Adiciona outros usuários
    onValue(usersRef, (snapshot) => {
        userList.innerHTML = ''; // Limpa a lista existente
        snapshot.forEach((childSnapshot) => {
            const userId = childSnapshot.key;
            const userData = childSnapshot.val();
            if (userId !== currentUserId) {
                const userItem = document.createElement('li');
                userItem.classList.add('list-group-item');
                userItem.innerHTML = `<img src="${userData.userPhoto || 'default-profile.png'}" alt="${userData.userName}" class="rounded-circle me-2" height="40">
                                    <span class="font-weight-bold">${userData.userName}</span>`;
                userItem.addEventListener('click', () => startConversation(userId));
                userList.appendChild(userItem);
            }
        });
        // Adiciona o item "Todos" de volta
        userList.appendChild(allUsersItem);
        // Adiciona o próprio usuário de volta
        userList.appendChild(currentUserItem);
    });
}

// Envia uma mensagem para o banco de dados
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (message || file) {
        let fileUrl = '';

        if (file) {
            const fileRef = storageRef(storage, `chat-files/${file.name}`);
            try {
                await uploadBytes(fileRef, file);
                fileUrl = await getDownloadURL(fileRef);
            } catch (error) {
                console.error('Erro ao fazer upload do arquivo:', error);
                return;
            }
        }

        try {
            const newMessageRef = push(messagesRef);
            await set(newMessageRef, {
                userId: currentUserId,
                userName: currentUserName,
                userPhoto: currentUserPhoto,
                message: message,
                fileUrl: fileUrl,
                timestamp: Date.now(),
                recipientId: currentConversationId
            });
            console.log('Mensagem enviada com sucesso!');
            messageInput.value = '';
            fileInput.value = ''; // Limpa o campo de arquivo
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    } else {
        console.log('Mensagem e arquivo vazios não enviados.');
    }
}

document.getElementById('sendButton').addEventListener('click', sendMessage);

// Envia mensagem ao pressionar Enter
document.getElementById('messageInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Anexa arquivo ao clicar no ícone de clipe
document.getElementById('attachButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

// Recebe mensagens do banco de dados
onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    if (currentConversationId === 'todos' || messageData.recipientId === currentConversationId) {
        displayMessage(messageData.message, messageData.userName, messageData.userId === currentUserId, messageData.fileUrl);
    }
});

function displayMessage(message, userName, isSent, fileUrl) {
    const messageElement = document.createElement('div');
    const userNameElement = document.createElement('small');
    userNameElement.textContent = userName;
    userNameElement.classList.add('d-block', 'text-muted', isSent ? 'text-end' : 'text-start');

    if (fileUrl) {
        const fileLink = document.createElement('a');
        fileLink.href = fileUrl;
        fileLink.textContent = 'Arquivo enviado';
        fileLink.target = '_blank';
        fileLink.classList.add('d-block', isSent ? 'text-end' : 'text-start');
        messageElement.appendChild(fileLink);
    }

    if (message) {
        const textElement = document.createElement('div');
        textElement.textContent = message;
        textElement.classList.add('message', isSent ? 'sent' : 'received');
        messageElement.appendChild(textElement);
    }

    const messagesContainer = document.getElementById('messages');
    messagesContainer.appendChild(userNameElement);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function startConversation(userId) {
    currentConversationId = userId;
    document.getElementById('messages').innerHTML = ''; // Limpa mensagens atuais
    console.log(`Iniciar conversa com ${userId}`);
    // Atualiza a janela de chat com mensagens do usuário selecionado
}

// Inicializa a lista de usuários
updateUserList();
