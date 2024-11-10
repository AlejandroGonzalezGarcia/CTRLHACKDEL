const socket = io();

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Retrieve the username and board ID from localStorage
const username = localStorage.getItem('username') || 'Guest'; // default guest
const boardID = localStorage.getItem('boardID') || 'Unknown ID'; // default unkown room ID

// Display board ID and username
document.getElementById('usernameDisplay').textContent = `User: ${username}`;
document.getElementById('boardIDDisplay').textContent = `Board ID: ${boardID}`;

// Join the board room
socket.emit('joinBoard', { boardID, username });

// Listen for real-time user count updates
socket.on('userCountUpdate', (count) => {
    document.getElementById('userCountDisplay').textContent = `Users in board: ${count}`;
});

// Send a message to the server when the Send button is clicked
document.getElementById('sendButton').addEventListener('click', () => {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (message) {
        // Send the message to the server
        socket.emit('message', { boardID, message });
        chatInput.value = ''; // Clear the input field after sending
    }
});

// Listen for incoming messages and display them
socket.on('message', (data) => {
    const { username, message } = data;
    displayMessage(username, message);
});

// Function to display a message in the chat box
function displayMessage(username, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);

    // Scroll to the bottom to show the latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Clear the username from localStorage on page unload (optional)
window.addEventListener('beforeunload', () => {
    localStorage.removeItem('username');
});

// Set up canvas dimensions and preserve drawings on resize
function resizeCanvas() {
    const savedImage = canvas.toDataURL(); // Save current canvas content as an image
    const container = document.getElementById('whiteboardContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const img = new Image();
    img.src = savedImage;
    img.onload = () => context.drawImage(img, 0, 0); // Redraw saved image
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing state
let drawing = false;
let current = { x: 0, y: 0 };
let color = '#000000'; // Default drawing color
let isEraser = false;  // Eraser mode toggle
let penSize = parseFloat(document.getElementById('sizeSlider').value); // pen size depends on slider value

// Display initial slider value 
const sliderValueDisplay = document.getElementById('sliderValue');
sliderValueDisplay.textContent = `${penSize.toFixed(1)} mm`;

// Update pen size based on slider input 
document.getElementById('sizeSlider').addEventListener('input', (event) => {
    penSize = parseFloat(event.target.value);
    sliderValueDisplay.textContent = `${penSize.toFixed(1)} mm`;
    console.log(`Pen/Eraser size set to ${penSize}`);
});

// Event listeners for toolbar buttons
document.getElementById('penButton').addEventListener('click', () => {
    isEraser = false;  // Switch to drawing mode
    context.globalCompositeOperation = 'source-over'; // Drawing mode
});

document.getElementById('eraserButton').addEventListener('click', () => {
    isEraser = true;   // Switch to eraser mode
    context.globalCompositeOperation = 'destination-out'; // Eraser mode
});

document.getElementById('colorPicker').addEventListener('input', (event) => {
    color = event.target.value;
    isEraser = false;  // Ensure we're in pen mode after color selection
    context.globalCompositeOperation = 'source-over'; // Reset to drawing mode
});


// Adding the clear button functionality
document.getElementById('clearButton').addEventListener('click', clearCanvas);
document.getElementById('saveImageButton').addEventListener('click', saveAsImage); // Save as Image button event

// Event listeners for drawing on the canvas
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    drawing = true;
    current.x = e.clientX - rect.left;
    current.y = e.clientY - rect.top;
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x0 = current.x;
    const y0 = current.y;
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;

    drawLine(x0, y0, x1, y1, color, isEraser, true);
    current.x = x1;
    current.y = y1;
});

// Function to draw on the canvas and emit data
function drawLine(x0, y0, x1, y1, color, isEraser, emit) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = penSize;
    context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    context.stroke();
    context.closePath();

    if (!emit) return;

    const w = canvas.width;
    const h = canvas.height;
    socket.emit('draw', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
        isEraser: isEraser
    });
}

// Function to clear the canvas
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas content

    // Notify other users via WebSocket
    socket.emit('clear', { boardID });
}
// Handle incoming drawing data from WebSocket
socket.on('draw', (data) => {
    const w = canvas.width;
    const h = canvas.height;
    context.globalCompositeOperation = data.isEraser ? 'destination-out' : 'source-over';
    context.lineWidth = data.penSize;  // Use the received pen size
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.isEraser, false);
});

socket.on('clear', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

// Error handling for WebSocket
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

// Function to save canvas content as an image
function saveAsImage() {
    const image = canvas.toDataURL('image/png'); // Convert canvas to PNG image data
    const link = document.createElement('a'); // Create a temporary download link
    link.href = image;
    link.download = 'whiteboard.png'; // Set the download name for the image
    link.click(); // Trigger the download
}

////////////