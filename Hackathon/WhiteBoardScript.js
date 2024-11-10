const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Ensure canvas dimensions adjust to container size
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
let color = '#000000';
let isEraser = false;
let penSize = 2;

// Pages management
let pages = []; // Array to store each page's canvas data URL
let currentPageIndex = 0;

// Initialize with an empty page
pages.push(null);

// Tool button event listeners
document.getElementById('penButton').addEventListener('click', () => {
    isEraser = false;
    setActiveTool('penButton');
    console.log("Pen tool selected");
});

document.getElementById('eraserButton').addEventListener('click', () => {
    isEraser = true;
    setActiveTool('eraserButton');
    console.log("Eraser tool selected");
});

document.getElementById('colorPicker').addEventListener('input', (event) => {
    color = event.target.value;
    isEraser = false;
    setActiveTool('penButton');
    console.log("Color changed to", color);
});

document.getElementById('sizeSmall').addEventListener('click', () => {
    penSize = 2;
    setActiveSize('sizeSmall');
});
document.getElementById('sizeMedium').addEventListener('click', () => {
    penSize = 5;
    setActiveSize('sizeMedium');
});
document.getElementById('sizeLarge').addEventListener('click', () => {
    penSize = 10;
    setActiveSize('sizeLarge');
});

// Clear button functionality
document.getElementById('clearButton').addEventListener('click', () => {
    clearCanvas();
    console.log("Canvas cleared");
});

// Save image button functionality
document.getElementById('saveImageButton').addEventListener('click', () => {
    saveAsImage();
    console.log("Image saved");
});

// Page navigation buttons
document.getElementById('prevPageButton').addEventListener('click', prevPage);
document.getElementById('nextPageButton').addEventListener('click', nextPage);

// Canvas drawing event listeners
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    current.x = e.clientX - canvas.offsetLeft;
    current.y = e.clientY - canvas.offsetTop;
    console.log("Mouse down at", current.x, current.y);
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    console.log("Mouse up, drawing ended");
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const x0 = current.x;
    const y0 = current.y;
    const x1 = e.clientX - canvas.offsetLeft;
    const y1 = e.clientY - canvas.offsetTop;
    drawLine(x0, y0, x1, y1, isEraser ? '#FFFFFF' : color);
    current.x = x1;
    current.y = y1;
    console.log("Drawing line to", x1, y1);
});

// Function to draw on the canvas
function drawLine(x0, y0, x1, y1, color) {
    console.log(`Drawing line from (${x0}, ${y0}) to (${x1}, ${y1}) with color ${color} and width ${isEraser ? penSize * 2 : penSize}`);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = penSize; // The same penSize is used for both pen and eraser
    context.stroke();
    context.closePath();
}

// Function to save the current page
function saveCurrentPage() {
    pages[currentPageIndex] = canvas.toDataURL();
    console.log("Page saved at index", currentPageIndex);
}

// Function to load a page onto the canvas
function loadPage(pageIndex) {
    clearCanvas(); // Clear current canvas
    const pageData = pages[pageIndex];
    if (pageData) {
        const img = new Image();
        img.src = pageData;
        img.onload = () => context.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log("Page loaded at index", pageIndex);
    } else {
        console.log("New blank page at index", pageIndex);
    }
}

// Page navigation functions
function prevPage() {
    saveCurrentPage();
    if (currentPageIndex > 0) {
        currentPageIndex--;
        loadPage(currentPageIndex);
    }
}

function nextPage() {
    saveCurrentPage();
    if (currentPageIndex < pages.length - 1) {
        currentPageIndex++;
    } else {
        pages.push(null);
        currentPageIndex++;
    }
    loadPage(currentPageIndex);
}

// Function to clear the canvas
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to save canvas as an image
function saveAsImage() {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'whiteboard.png';
    link.click();
}

// Set the active tool in the toolbar
function setActiveTool(toolId) {
    document.getElementById('penButton').classList.remove('active');
    document.getElementById('eraserButton').classList.remove('active');
    document.getElementById(toolId).classList.add('active');
}

// Set the active size for pen and eraser size tools
function setActiveSize(sizeId) {
    document.getElementById('sizeSmall').classList.remove('active');
    document.getElementById('sizeMedium').classList.remove('active');
    document.getElementById('sizeLarge').classList.remove('active');
    document.getElementById(sizeId).classList.add('active');
    context.lineWidth = penSize; // Set the penSize for both pen and eraser
}