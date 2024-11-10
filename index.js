// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto'); // For generating unique IDs

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve 'home.html' at the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Serve 'whiteboard.html' for the whiteboard page at a different route
app.get('/WhiteBoard', (req, res) => {
    res.sendFile(__dirname + '/public/WhiteBoard.html');
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Store active whiteboards
const activeBoards = {};

// Generate a unique 6-character alphanumeric board ID
function generateBoardID() {
    return crypto.randomBytes(3).toString('hex');
}

// Route to create a new board
app.get('/create-board', (req, res) => {
    const boardID = generateBoardID();

    // Add the board to activeBoards and initialize an empty user list
    activeBoards[boardID] = { users: [] };

    console.log(`Created new whiteboard with ID: ${boardID}`);
    res.json({ boardID });
});



// Route to join an existing board
app.get('/join-board', (req, res) => {
    const { boardID, username } = req.query;

    if (!activeBoards[boardID]) {
        return res.json({ success: false, error: 'board_not_found' });
    }
    
    if (activeBoards[boardID].users.includes(username)) {
        return res.json({ success: false, error: 'username_taken' });
    }

    // If board exists and username is unique
    res.json({ success: true });
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    // console.log('A user connected:', socket.id);

    // Listen for drawing events from the client
    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });

    // Listen for clear events from the client
    socket.on('clear', () => {
        socket.broadcast.emit('clear');
    });

    socket.on('prevPage', ({ boardID }) => {
        const board = activeBoards[boardID];
        if (board && board.currentPage > 0) {
            board.currentPage--;
            io.to(boardID).emit('pageChanged', { currentPage: board.currentPage });
        }
    });

    // Handle join requests
    socket.on('joinBoard', (data) => {
        const { boardID, username } = data;

        if (activeBoards[boardID]) {
            // Add the user to the room
            socket.username = username;
            socket.boardID = boardID;
            socket.join(boardID);
            activeBoards[boardID].users.push(username);

            // Emit updated user count to the room
            io.to(boardID).emit('userCountUpdate', activeBoards[boardID].users.length);

            socket.to(boardID).emit('userJoined', `${username} joined the board.`);
            console.log(`${username} joined board ${boardID}`);

        } else {
            // Send an error if the board does not exist
            socket.emit('error', 'Board not found');
        }
    });

    // Handle receiving a chat message and broadcast within the room
    socket.on('message', (data) => {
        const { boardID, message } = data;
        const username = socket.username;

        // Broadcast the message to everyone in the board room
        io.to(boardID).emit('message', { username, message });
        console.log(`[${boardID}] ${username}: ${message}`);
    });

    // Handle errors
    socket.on('error', (err) => {
        console.error(`Socket error from ${socket.id}:`, err);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const username = socket.username;
        const boardID = socket.boardID;

        console.log("A user disconnected:", username);

        if (boardID && activeBoards[boardID]) {
            // Remove the user from the board
            activeBoards[boardID].users = activeBoards[boardID].users.filter(user => user !== username);

            // Emit updated user count to the room
            io.to(boardID).emit('userCountUpdate', activeBoards[boardID].users.length);
            console.log(`User count updated for board ${boardID}. Total users: ${activeBoards[boardID].users.length}`);

            // Delete the board if no users remain
            if (activeBoards[boardID].users.length === 0) {
                delete activeBoards[boardID];
                console.log(`Deleted board ${boardID} (no users left)`);
            }
        }
    });

});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
