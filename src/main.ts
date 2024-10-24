import "./style.css";





// configs
const APP_NAME = "Simple Painter";
const CANVAS_DIMENSION = {x: 256, y: 256};
const DRAWING_CHANGE_EVENT = "drawing-changed";





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





// drawing system
function empty_canvas(
        canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

type PointOnCanvas = {x: number, y: number};
type DrawingStroke = PointOnCanvas[];
let strokes: DrawingStroke[] = [];


// observer for the "drawing-changed" event
canvas_element.addEventListener(DRAWING_CHANGE_EVENT, () => {
    empty_canvas(canvas_element, canvas_context);

    for (const stroke of strokes) {
        if (stroke.length == 1) { continue; }
        let [first_point, ...rest_point] = stroke;

        canvas_context.beginPath();
        canvas_context.moveTo(first_point.x, first_point.y);

        // draw rest of point
        let last_point: PointOnCanvas = first_point

        for (const point of rest_point) {
            canvas_context.lineTo(point.x, point.y);
            last_point = point;
        }

        canvas_context.stroke();
    }

});


// cursor & canvas
let current_stroke_idx: number | null = null;

// start new stroke
canvas_element.addEventListener("mousedown", (event) => {
    if (current_stroke_idx === null) {
        current_stroke_idx = strokes.length;
        const current_stroke = [{x: event.offsetX, y: event.offsetY}];
        strokes.push(current_stroke);
    }
});

// during drawing
canvas_element.addEventListener("mousemove", (event) => {
    if (current_stroke_idx !== null) {
        strokes[current_stroke_idx].push({x: event.offsetX, y: event.offsetY});

        canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
    }
});

// finish drawing
canvas_element.addEventListener("mouseup", (event) => {
    current_stroke_idx = null;

    canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
});





// clear button
const button_element: HTMLButtonElement = document.createElement('button');
button_element.type = 'button';
button_element.textContent = 'clear';

button_element.addEventListener('click', () => {
    strokes = [];
    canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
});

app.append(button_element);
