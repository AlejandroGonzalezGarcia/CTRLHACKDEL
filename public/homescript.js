async function createWhiteboard() {
    const username = prompt("Enter your username (max 12 characters):");
    if (username && username.length <= 12) {
        try {
            // Request a unique board ID from the server
            const response = await fetch('/create-board');
            const data = await response.json();
            const boardID = data.boardID;

            // Save username and board ID in localStorage and redirect
            localStorage.setItem('username', username);
            localStorage.setItem('boardID', boardID);
            window.location.href = `/WhiteBoard?boardID=${boardID}`;
        } catch (error) {
            alert("Failed to create whiteboard. Please try again.");
            console.error(error);
        }
    } else {
        alert("Invalid username. Please ensure it's 12 characters or fewer.");
    }
}

async function joinWhiteboard() {
    let username = prompt("Enter your username (max 12 characters):");
    let boardID = prompt("Enter the board ID:");
    
    while (username && username.length > 12) {
        username = prompt("Username too long. Please enter a username up to 12 characters.");
    }
    
    if (username && boardID) {
        try {
            // Check if the board exists and if the username is unique
            const response = await fetch(`/join-board?boardID=${boardID}&username=${username}`);
            const data = await response.json();

            if (data.success) {
                // Save valid username and board ID to localStorage and proceed
                localStorage.setItem('username', username);
                localStorage.setItem('boardID', boardID);
                window.location.href = `/WhiteBoard?boardID=${boardID}`;
            } else {
                // Display error message and re-prompt for username if needed
                if (data.error === 'username_taken') {
                    alert("Username is already taken. Please enter a different username.");
                    joinWhiteboard(); // Restart the join process
                } else {
                    alert("Board ID does not exist. Please enter a valid board ID.");
                }
            }
        } catch (error) {
            alert("Failed to join whiteboard. Please try again.");
            console.error(error);
        }
    } else {
        alert("Invalid input. Please enter both a username and board ID.");
    }
}