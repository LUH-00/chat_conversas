const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Certifique-se de que a pasta 'public' contém o 'index.html', 'script.js' e 'styles.css'

io.on('connection', (socket) => {
    console.log('Usuário conectado');

    socket.on('message', (msg) => {
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

server.listen(3001, () => {
    console.log('Servidor rodando em http://localhost:3001');
});
