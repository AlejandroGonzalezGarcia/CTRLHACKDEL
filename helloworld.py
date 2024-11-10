import cv2
import random
import re  # Import regular expression module
from PIL import Image
from pytesseract import pytesseract

# List of trivia questions and answers
questions_answers = [
    ("What is the capital of France?", "Paris"),
    ("What is the largest planet in our solar system?", "Jupiter"),
    ("What is the largest ocean on Earth?", "Pacific"),
    ("What is the boiling point of water?", "100"),
    ("What year did the Titanic sink?", "1912")
]

# Function to process the image using Tesseract
def tesseract(image_path):
    # Specify the full path to tesseract executable
    path_to_tesseract = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    # Set the tesseract command path
    pytesseract.tesseract_cmd = path_to_tesseract

    # Extract text from the image using pytesseract
    text = pytesseract.image_to_string(Image.open(image_path))

    # Clean up the text by removing non-alphanumeric characters and spaces
    cleaned_text = re.sub(r'[^a-zA-Z0-9]', '', text).strip().lower()  # Remove non-alphanumeric characters and spaces, keep alphanumeric only

    # Return the cleaned-up text for comparison
    return cleaned_text

# Main function to handle the trivia game
def trivia_game():
    camera = cv2.VideoCapture(0)  # Initialize the camera

    if not camera.isOpened():
        print("Error: Could not open camera.")
        return

    # Loop to keep selecting a random question and checking answers
    while True:
        # Select a random question-answer pair each time from the list
        question, correct_answer = random.choice(questions_answers)

        # Loop to capture frames from the camera until the correct answer is given
        while True:
            ret, frame = camera.read()  # Capture frame
            if not ret:
                print("Failed to grab frame")
                break

            # Overlay the trivia question on the camera feed
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.8  # Adjust font size
            color = (255, 255, 255)  # White text color
            thickness = 2

            # Get the size of the text so we can adjust positioning
            (text_width, text_height), _ = cv2.getTextSize(question, font, font_scale, thickness)
            
            # Center the text on the screen
            text_x = (frame.shape[1] - text_width) // 2
            text_y = 30  # Position it near the top of the screen

            cv2.putText(frame, question, (text_x, text_y), font, font_scale, color, thickness, cv2.LINE_AA)

            # Display the captured frame
            cv2.imshow('Text detection', frame)

            # Wait for 's' key to save the image, 'q' to quit
            key = cv2.waitKey(1) & 0xFF

            if key == ord('s'):  # If 's' is pressed, save the image
                cv2.imwrite('test1.jpg', frame)  # Save the image
                print("Image saved, now running Tesseract...")

                # Process the image using Tesseract
                detected_text = tesseract('test1.jpg')

                # Print the detected text after cleaning
                print("Detected text:", detected_text)

                # Check if the detected text matches the correct answer (case-insensitive)
                if detected_text == correct_answer.lower():  # Compare cleaned text with correct answer
                    print("Hello World")  # Only print Hello World if the answer is correct
                    camera.release()  # Release the camera
                    cv2.destroyAllWindows()  # Close all OpenCV windows
                    return  # Exit the function, ending the game
                else:
                    print("That is incorrect! Please try again.")
                    # After an incorrect answer, continue the loop and select a new question for the next attempt
                    break  # This breaks the inner loop, ensuring the question is randomized again for the next attempt
            elif key == ord('q'):  # If 'q' is pressed, quit the program
                break

        # After answering correctly or quitting, select a new random question for the next iteration
        if key == ord('q'):
            break

... (7 lines left)