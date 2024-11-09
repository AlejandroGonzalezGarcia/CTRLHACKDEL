const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const socket = new WebSocket('ws://' + window.location.host + '/ws/whiteboard/');
document.addEventListener('DOMContentLoaded', clearCanvas);
// Set up canvas dimensions
function resizeCanvas() {
    const container = document.getElementById('whiteboardContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing state
let drawing = false;
let current = { x: 0, y: 0 };
let color = '#000000'; // Default drawing color
let isEraser = false;  // Eraser mode toggle
let penSize = 2; // Default pen size

// Event listeners for toolbar buttons
document.getElementById('penButton').addEventListener('click', () => {
    isEraser = false;  // Switch to drawing mode
    setActiveTool('penButton');
});

document.getElementById('eraserButton').addEventListener('click', () => {
    isEraser = true;   // Switch to eraser mode
    setActiveTool('eraserButton');
});

document.getElementById('colorPicker').addEventListener('input', (event) => {
    color = event.target.value;
    isEraser = false;  // Ensure we're in pen mode after color selection
    setActiveTool('penButton');
});

// Change pen/eraser size
document.getElementById('sizeSmall').addEventListener('click', () => {
    penSize = 2;  // Small size
    setActiveSize('sizeSmall');
});
document.getElementById('sizeMedium').addEventListener('click', () => {
    penSize = 5;  // Medium size
    setActiveSize('sizeMedium');
});
document.getElementById('sizeLarge').addEventListener('click', () => {
    penSize = 10; // Large size
    setActiveSize('sizeLarge');
});

// Clear button functionality
document.getElementById('clearButton').addEventListener('click', clearCanvas);

// Save button functionality
document.getElementById('saveImageButton').addEventListener('click', saveAsImage);

// Event listeners for drawing on the canvas
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    current.x = e.clientX - canvas.offsetLeft;
    current.y = e.clientY - canvas.offsetTop;
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const x0 = current.x;
    const y0 = current.y;
    const x1 = e.clientX - canvas.offsetLeft;
    const y1 = e.clientY - canvas.offsetTop;
    drawLine(x0, y0, x1, y1, isEraser ? '#FFFFFF' : color, true); // Use white for erasing
    current.x = x1;
    current.y = y1;
});

// Function to draw on the canvas and emit data
function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = isEraser ? penSize * 2 : penSize;  // Adjust size based on the selected tool
    context.stroke();
    context.closePath();

    if (!emit) return;

    const w = canvas.width;
    const h = canvas.height;
    socket.send(JSON.stringify({
        type: 'draw',
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
    }));
}

// Function to clear the canvas
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas content

    // Notify other users via WebSocket
    socket.send(JSON.stringify({
        type: 'clear'
    }));
}

// Handle incoming drawing data from WebSocket
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'clear') {
        context.clearRect(0, 0, canvas.width, canvas.height);
    } else if (data.type === 'draw') {
        const w = canvas.width;
        const h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }
};

// Function to save canvas content as an image
function saveAsImage() {
    const image = canvas.toDataURL('image/png'); // Convert canvas to PNG image data
    const link = document.createElement('a'); // Create a temporary download link
    link.href = image;
    link.download = 'whiteboard.png'; // Set the download name for the image
    link.click(); // Trigger the download
}

// Set the active tool in the toolbar
function setActiveTool(toolId) {
    // Remove active class from all tools
    document.getElementById('penButton').classList.remove('active');
    document.getElementById('eraserButton').classList.remove('active');
    document.getElementById('sizeSmall').classList.remove('active');
    document.getElementById('sizeMedium').classList.remove('active');
    document.getElementById('sizeLarge').classList.remove('active');

    // Add active class to the clicked tool
    document.getElementById(toolId).classList.add('active');
}

// Set the active size for pen size tools
function setActiveSize(sizeId) {
    document.getElementById('sizeSmall').classList.remove('active');
    document.getElementById('sizeMedium').classList.remove('active');
    document.getElementById('sizeLarge').classList.remove('active');
    document.getElementById(sizeId).classList.add('active');
}
