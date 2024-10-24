import "./style.css";

import { CommandSystem, UndoableCommand } from "./undo_system.ts";





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
const commands = new CommandSystem();

function empty_canvas(
        canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

commands.initializers.push(() => {
    empty_canvas(canvas_element, canvas_context);
});

type PointOnCanvas = {x: number, y: number};

class DrawingStroke extends Array<PointOnCanvas> implements UndoableCommand {

    execute() {
        if (this.length == 1) { return; }

        let [first_point, ...rest_point] = this;

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

    undo() {
        return false;
    }
}


let current_stroke: DrawingStroke | null = null;


// observer for the "drawing-changed" event
canvas_element.addEventListener(DRAWING_CHANGE_EVENT, () => {
    current_stroke?.execute();
});






// start new stroke
canvas_element.addEventListener("mousedown", (event) => {
    if (current_stroke === null) {
        current_stroke = new DrawingStroke();
        current_stroke.push({x: event.offsetX, y: event.offsetY});

        canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
    }
});

// during drawing
canvas_element.addEventListener("mousemove", (event) => {
    if (current_stroke !== null) {
        current_stroke.push({x: event.offsetX, y: event.offsetY});
        canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
    }
});

// finish drawing
function finish_drawing_event_listener(event) {
    if (current_stroke !== null) {
        commands.push(current_stroke!);
        current_stroke = null;
        canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
    }

}
canvas_element.addEventListener("mouseup", finish_drawing_event_listener);
canvas_element.addEventListener("mouseleave", finish_drawing_event_listener);





// buttons
// create a div container
const button_div_element: HTMLDivElement = document.createElement('div');

// clear button
const button_clear: HTMLButtonElement = document.createElement('button');
button_clear.type = 'button';
button_clear.textContent = 'clear';

button_clear.addEventListener('click', () => {
    commands.initialize();
    canvas_element.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
});
button_div_element.append(button_clear);

// undo button
const button_undo: HTMLButtonElement = document.createElement('button');
button_undo.type = 'button';
button_undo.textContent = 'undo';

button_undo.addEventListener('click', () => {
    commands.undo();
});
button_div_element.append(button_undo);

// redo button
const button_redo: HTMLButtonElement = document.createElement('button');
button_redo.type = 'button';
button_redo.textContent = 'redo';

button_redo.addEventListener('click', () => {
    commands.redo();
});
button_div_element.append(button_redo);

// append the container to the app
app.append(button_div_element);
