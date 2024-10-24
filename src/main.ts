import "./style.css";





// configs
const APP_NAME = "Simple Painter"
const CANVAS_DIMENSION = {x: 256, y: 256}





// app
document.title = APP_NAME;
const app = document.querySelector<HTMLDivElement>("#app")!;





// title element
const title_element = document.createElement('h1');
title_element.innerText = APP_NAME;
app.append(title_element);





// canvas element
const canvas_element = document.createElement('canvas');
canvas_element.width = CANVAS_DIMENSION.x;
canvas_element.height = CANVAS_DIMENSION.y;
app.append(canvas_element);

const canvas_context = canvas_element.getContext('2d')!;

// cursor actions
const cursor = {active: false, x: 0, y: 0};

// start drawing
canvas_element.addEventListener("mousedown", (event) => {
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
});

// during drawing
canvas_element.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        canvas_context.beginPath();
        canvas_context.moveTo(cursor.x, cursor.y);
        canvas_context.lineTo(event.offsetX, event.offsetY);
        canvas_context.stroke();
        // save for next stroke
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
    }
});

// finish drawing
canvas_element.addEventListener("mouseup", (event) => {
    cursor.active = false;
});




// clear button
const button_element: HTMLButtonElement = document.createElement('button');
button_element.type = 'button';
button_element.textContent = 'clear';

button_element.addEventListener('click', () => {
    canvas_context.clearRect(0, 0, canvas_element.width, canvas_element.height);
});

app.append(button_element);
