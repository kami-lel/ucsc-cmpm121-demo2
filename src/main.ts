import "./style.css";





// configs
const APP_NAME = "Simple Painter";
const CANVAS_DIMENSION = {x: 256, y: 256};
const DRAWING_CHANGE_EVENT = "drawing-changed";
const TAB_SWITCH_EVENT = "tab-switch";
const TOOL_MOVED_EVENT = "tool-moved";

const THICKNESS_THICK = 5;
const THICKNESS_THIN = 1;
const _THICKNESS_DIVISOR = 10;





// app
document.title = APP_NAME;
const app = document.querySelector<HTMLDivElement>("#app")!;





// title element
const title_element = document.createElement('h1');
title_element.innerText = APP_NAME;
app.append(title_element);





// canvas element
const canvas = document.createElement('canvas');
canvas.width = CANVAS_DIMENSION.x;
canvas.height = CANVAS_DIMENSION.y;
app.append(canvas);













// tool preview
interface ToolPreview {
    draw(context: CanvasRenderingContext2D): void;
}

let mouse_current: PointOnCanvas;
const tool_preview = {draw: (context) => {
    context.beginPath();
    // HACK
    context.arc(mouse_current.x, mouse_current.y, render_system.marker_stroke_thickness, 0, Math.PI*2);

    context.fillStype = 'black';
    context.fill();
    context.closePath();
}}












// drawing system
interface UndoableDraw {
    do(): void;
}


class RenderSystem extends Array<UndoableDraw> {
    public undo_cache: Array<UndoableDraw>;
    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    public marker_stroke_thickness: number;

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas
        this.context = canvas.getContext('2d')!;
        this.marker_stroke_thickness = THICKNESS_THICK;
    }

    undo(times?: number): void {
        if (times === undefined) {
            if (this.length == 0) { return; }

            let last_cmd = this.pop()!;
            this.undo_cache.push(last_cmd);

        } else {
            for (let i = 0; i < times; i++) {
                this.undo(); // recursively call undo specified number of times
            }
        }
    }

    redo(times?: number): void {
        if (times === undefined) {
            // exit if no further actions to redo
            if (this.undo_cache.length === 0) { return; }

            let redo_cmd = this.undo_cache.pop()!;
            redo_cmd.do();
            this.push(redo_cmd);

        } else {
            for (let i = 0; i < times; i++) {
                this.redo(); // recursively call redo specified number of times
            }
        }
    }

    clear() {
        this.length = 0;
        this.undo_cache.length = 0;
    }

    add(new_draw: UndoableDraw) {
        this.undo_cache = [];
        super.push(new_draw);
    }

    empty_canvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        this.empty_canvas();

        // render tool preview
        tool_preview.draw(this.context);

        // render draw queue
        for (const draw of this) {
            draw.do();
        }
    }

}


const render_system = new RenderSystem(canvas);













type PointOnCanvas = {x: number, y: number};
// Marker
class MarkerStroke extends Array<PointOnCanvas> implements UndoableDraw{
    private thickness: number;

    constructor(thickness: number) {
        super();
        this.thickness = thickness;
    }

    display(context: CanvasRenderingContext2D): void {
        if (this.length == 1) { return; }

        const [first_point, ...rest_point] = this;

        context.beginPath();
        context.lineWidth = this.thickness;
        context.moveTo(first_point.x, first_point.y);

        // draw rest of point
        for (const point of rest_point) {
            context.lineTo(point.x, point.y);
        }

        context.stroke();

    }

    do() {
        this.display(render_system.context);
    }
}

let current_stroke: MarkerStroke | null = null;


canvas.addEventListener(DRAWING_CHANGE_EVENT, () => {
    render_system.render();
    current_stroke?.do();
});

canvas.addEventListener(TOOL_MOVED_EVENT, () => {
    render_system.render();
    current_stroke?.do();
});





// start new stroke
canvas.addEventListener("mousedown", (event) => {
    if (current_stroke === null) {
        current_stroke = new MarkerStroke(render_system.marker_stroke_thickness);
        current_stroke.push({x: event.offsetX, y: event.offsetY});

        canvas.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
    }
});

// during drawing
canvas.addEventListener("mousemove", (event) => {
    mouse_current = {x: event.offsetX, y: event.offsetY};  // HACK
    if (current_stroke !== null) {
        current_stroke.push(mouse_current);
    }
    canvas.dispatchEvent(new Event(TOOL_MOVED_EVENT));
});

// finish drawing
function finish_drawing_event_listener(_event: MouseEvent) {
    if (current_stroke !== null) {
        render_system.add(current_stroke!);
        current_stroke = null;
        canvas.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
    }

}
canvas.addEventListener("mouseup", finish_drawing_event_listener);
canvas.addEventListener("mouseleave", finish_drawing_event_listener);














// inputs buttons
const input_div_element: HTMLDivElement = document.createElement('div');
input_div_element.className = 'inputs';
app.append(input_div_element);



// universal buttons, viz. clear, undo, redo
const universal_buttons_div_element: HTMLDivElement = document.createElement('div');
input_div_element.append(universal_buttons_div_element);

// clear button
const button_clear: HTMLButtonElement = document.createElement('button');
button_clear.type = 'button';
button_clear.textContent = 'clear';

button_clear.addEventListener('click', () => {
    render_system.clear();
    canvas.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
});
universal_buttons_div_element.append(button_clear);

// undo button
const button_undo: HTMLButtonElement = document.createElement('button');
button_undo.type = 'button';
button_undo.textContent = 'undo';

button_undo.addEventListener('click', () => {
    render_system.undo();
    canvas.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
});
universal_buttons_div_element.append(button_undo);

// redo button
const button_redo: HTMLButtonElement = document.createElement('button');
button_redo.type = 'button';
button_redo.textContent = 'redo';

button_redo.addEventListener('click', () => {
    render_system.redo();
    canvas.dispatchEvent(new Event(DRAWING_CHANGE_EVENT));
});
universal_buttons_div_element.append(button_redo);




// tabs
const tab_selection_buttons_div_element: HTMLDivElement =
        document.createElement('div');
input_div_element.append(tab_selection_buttons_div_element);


let selected_tool: string;

class SelectionTab {
    public name: string;
    public button: HTMLButtonElement;
    public div: HTMLDivElement;

    constructor(name: string, set_up_div: (div: HTMLDivElement) => void) {
        this.name = name;

        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.textContent = this.name;
        this.button.className = 'tab-selection-button';
        this.button.addEventListener('click', () => {
           selected_tool = this.name;
           canvas.dispatchEvent(new Event(TAB_SWITCH_EVENT));
        });
        tab_selection_buttons_div_element.append(this.button);



        this.div = document.createElement('div');
        this.div.className = 'tab-div';
        this.div.style.display = 'none';
        set_up_div(this.div);
        input_div_element.append(this.div);
    }

    select(): void {
        this.button.classList.add('active');
        this.button.disabled = true;

        this.div.style.display = '';
    }

    de_select(): void {
        this.button.classList.remove('active');
        this.button.disabled = false;

        this.div.style.display = 'none';
    }
}



const tabs: Array<SelectionTab> = [];

tabs.push(new SelectionTab("Marker", (div) => {
   const slider = document.createElement('input');
   slider.type = 'range';
   slider.value = THICKNESS_THICK * _THICKNESS_DIVISOR;
    // add event listener for slide changing
    slider.addEventListener('input', (event: Event) => {
        const target = event.target as HTMLInputElement;
        render_system.marker_stroke_thickness =
            target.value / _THICKNESS_DIVISOR;
    });

   const thick_button = document.createElement('button');
   div.appendChild(thick_button);
   thick_button.textContent = 'Thick';
   thick_button.addEventListener('click', () => {
       render_system.marker_stroke_thickness = THICKNESS_THICK;
       slider.value = THICKNESS_THICK * _THICKNESS_DIVISOR;

   })


   const thin_button = document.createElement('button');
   div.appendChild(thin_button);
   thin_button.textContent = 'Thin';
   thin_button.addEventListener('click', () => {
       render_system.marker_stroke_thickness = THICKNESS_THIN;
       slider.value = THICKNESS_THIN * _THICKNESS_DIVISOR;
   })

   div.appendChild(slider);

}));

tabs.push(new SelectionTab("Sticker", (div) => {
    div.append('TODO sticker');  // TODO

}));


canvas.addEventListener(TAB_SWITCH_EVENT, () => {
    for (const tab of tabs) {
        if (tab.name == selected_tool) {
            tab.select();
        } else {
            tab.de_select();
        }

    }
});

tabs[0].select();

