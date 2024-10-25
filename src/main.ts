import "./style.css";





// configs
const APP_NAME = "Simple Painter";
const CANVAS_DIMENSION = {x: 256, y: 256};
const CANVAS_UPDATE_EVENT = 'canvas-update';
const TAB_SWITCH_EVENT = "tab-switch";

const MARKER_TOOL_NAME = 'Marker';
const STICKER_TOOL_NAME = 'Sticker';
const EXPORT_TOOL_NAME = 'Exporter';


const EXPORT_SCALE_UP = 4;
const EXPORT_DOWNLOAD_NAME = 'hd_export.png'

const THICKNESS_THICK = 5;
const THICKNESS_THIN = 1;
const _THICKNESS_DIVISOR = 10;

const STICKER_1 = '🚀'; // Rocket
const STICKER_2 = '🌈'; // Rainbow
const STICKER_3 = '🎨'; // Palette
const STICKER_CUSTOM = '😊'; // Smiley face emoji







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













type PointOnCanvas = {x: number, y: number};












// drawing system
interface UndoableDraw {
    do(context: CanvasRenderingContext2D): void;
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

    redo(times?: number, outside_context?: CanvasRenderingContext2D): void {
        const context = outside_context ? outside_context : this.context;

        if (times === undefined) {
            // exit if no further actions to redo
            if (this.undo_cache.length === 0) { return; }

            let redo_cmd = this.undo_cache.pop()!;
            redo_cmd.do(context);
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

    render(outside_context?: CanvasRenderingContext2D) {
        const context = outside_context ? outside_context : this.context;

        // render tool preview
        tools.current().preview_draw(context);

        // render draw queue
        for (const draw of this) {
            draw.do(context);
        }
    }

}


const render_system = new RenderSystem(canvas);


























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
    canvas.dispatchEvent(new Event(CANVAS_UPDATE_EVENT));
});
universal_buttons_div_element.append(button_clear);

// undo button
const button_undo: HTMLButtonElement = document.createElement('button');
button_undo.type = 'button';
button_undo.textContent = 'undo';

button_undo.addEventListener('click', () => {
    render_system.undo();
    canvas.dispatchEvent(new Event(CANVAS_UPDATE_EVENT));
});
universal_buttons_div_element.append(button_undo);

// redo button
const button_redo: HTMLButtonElement = document.createElement('button');
button_redo.type = 'button';
button_redo.textContent = 'redo';

button_redo.addEventListener('click', () => {
    render_system.redo();
    canvas.dispatchEvent(new Event(CANVAS_UPDATE_EVENT));
});
universal_buttons_div_element.append(button_redo);




// tabs
const tab_selection_buttons_div_element: HTMLDivElement =
        document.createElement('div');
input_div_element.append(tab_selection_buttons_div_element);













// tool system
class Tool {
    name: string;
    button_element: HTMLButtonElement;
    div_element: HTMLDivElement;

    constructor(name: string) {
        this.name = name;

        this.button_element = document.createElement('button');
        this.button_element.type = 'button';
        this.button_element.textContent = this.name;
        this.button_element.className = 'tab-selection-button';
        this.button_element.addEventListener('click', () => {
           tools.select(this.name);
           canvas.dispatchEvent(new Event(TAB_SWITCH_EVENT));
        });
        tab_selection_buttons_div_element.append(this.button_element);

        this.div_element = document.createElement('div');
        this.div_element.className = 'tab-div';
        this.div_element.style.display = 'none';
        this.init_div();
        input_div_element.append(this.div_element);
    }

    select(): void {
        this.button_element.classList.add('active');
        this.button_element.disabled = true;

        this.div_element.style.display = '';
    }

    de_select(): void {
        this.button_element.classList.remove('active');
        this.button_element.disabled = false;

        this.div_element.style.display = 'none';
    }

    preview_draw(context: CanvasRenderingContext2D): void {}

    protected init_div():void {}
}



class ToolSystem extends Array<Tool> {

    public current_tool_name: string;

    select(name: string) {
        this.current_tool_name = name;
        for (const tool of this) {
            if (tool.name == name) {
                tool.select();
            } else {
                tool.de_select();
            }
        }
    }

    current() {
        for (const tool of this) {
            if (tool.name == this.current_tool_name) {
                return tool;
            }
        }
        return this[0];
    }

}

const tools = new ToolSystem();












// Marker tool
class MarkerStroke extends Array<PointOnCanvas> implements UndoableDraw{
    private thickness: number;

    constructor(thickness: number) {
        super();
        this.thickness = thickness;
    }

    do(context: CanvasRenderingContext2D): void {
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
}



class MarkerTool extends Tool {
    current_stroke: MarkerStroke | null;
    thickness: number;

    constructor(name: string) {
        super(name);
        this.thickness = THICKNESS_THICK
        this.current_stroke = null;
    }

    preview_draw(context: CanvasRenderingContext2D): void {
        if (mouse_current !== null) {
            context.beginPath();
            context.arc(mouse_current.x, mouse_current.y,
                    this.thickness, 0, Math.PI*2);

            context.fillStyle = 'black';
            context.fill();
            context.closePath();
        }
    }

    protected init_div(): void {
       const slider = document.createElement('input');
       slider.type = 'range';
       slider.value = (THICKNESS_THICK * _THICKNESS_DIVISOR).toString();
       // add event listener for slide changing
       slider.addEventListener('input', (event: Event) => {
           const target = event.target as HTMLInputElement;
           this.thickness = target.value / _THICKNESS_DIVISOR;
       });

       const thick_button = document.createElement('button');
       this.div_element.appendChild(thick_button);
       thick_button.textContent = 'Thick';
       thick_button.addEventListener('click', () => {
           this.thickness = THICKNESS_THICK;
           slider.value = THICKNESS_THICK * _THICKNESS_DIVISOR;

       })


       const thin_button = document.createElement('button');
       this.div_element.appendChild(thin_button);
       thin_button.textContent = 'Thin';
       thin_button.addEventListener('click', () => {
           this.thickness = THICKNESS_THIN;
           slider.value = THICKNESS_THIN * _THICKNESS_DIVISOR;
       })

       this.div_element.appendChild(slider);
    }
}


const marker_tool = new MarkerTool(MARKER_TOOL_NAME);
tools.push(marker_tool);
tools.select(MARKER_TOOL_NAME);












// Sticker tool
function _draw_at(context: CanvasRenderingContext2D, point: PointOnCanvas,
        content: string) {
    // set font size for rendering
    context.font = '24px serif';

    // rendering position
    const x = point.x - 15;
    const y = point.y + 15;

    // draw the emoji on the context at specified coordinates
    context.fillText(content, x, y);
}

class StickerStamp implements UndoableDraw {
    sticker: string;
    position: PointOnCanvas

    constructor(sticker: string, position: PointOnCanvas) {
        this.sticker = sticker
        this.position = position;
    }

    do(context: CanvasRenderingContext2D): void {
        _draw_at(context, this.position, this.sticker);
    }
}

class StickerTool extends Tool {
    content: string = STICKER_1;

    protected init_div(): void {
        const button1 = document.createElement('button');
        button1.textContent = STICKER_1;
        button1.addEventListener('click', () => {
            this.content = STICKER_1;
        });

        const button2 = document.createElement('button');
        button2.textContent = STICKER_2;
        button2.addEventListener('click', () => {
            this.content = STICKER_2;
        });

        const button3 = document.createElement('button');
        button3.textContent = STICKER_3;
        button3.addEventListener('click', () => {
            this.content = STICKER_3;
        });

        const custom_button = document.createElement('button');
        custom_button.textContent ='custom';
        custom_button.addEventListener('click', () => {
            const opt = prompt("Customize Sticker", STICKER_CUSTOM);
            this.content = opt!;
        });

        // Append buttons to div_element
        this.div_element.appendChild(button1);
        this.div_element.appendChild(button2);
        this.div_element.appendChild(button3);
        this.div_element.appendChild(custom_button);
    }

    preview_draw(context: CanvasRenderingContext2D): void {
        _draw_at(context, mouse_current!, this.content);
    }
}

const sticker_tool = new StickerTool(STICKER_TOOL_NAME);
tools.push(sticker_tool);









// Exporter
class ExportTool extends Tool {

    protected init_div(): void {
        const export_button = document.createElement('button');
        export_button.textContent ='Export';
        export_button.addEventListener('click', () => {
            this.export_hd();
        });

        // Append buttons to div_element
        this.div_element.appendChild(export_button);
    }

    export_hd() {
        const temp_canvas = document.createElement('canvas');
        temp_canvas.width = canvas.width * EXPORT_SCALE_UP;
        temp_canvas.height = canvas.height * EXPORT_SCALE_UP;

        const temp_context =
                temp_canvas.getContext('2d') as CanvasRenderingContext2D;
        temp_context.scale(EXPORT_SCALE_UP, EXPORT_SCALE_UP);
        render_system.render(temp_context);

        // trigger download
        const anchor = document.createElement("a");
        anchor.href = temp_canvas.toDataURL("image/png");
        anchor.download = EXPORT_DOWNLOAD_NAME;
        anchor.click();
    }

}
const export_tool = new ExportTool(EXPORT_TOOL_NAME);
tools.push(export_tool);










// input from canvas
let mouse_current: PointOnCanvas | null = null;


canvas.addEventListener(CANVAS_UPDATE_EVENT, () => {
    render_system.context.clearRect(
            0, 0, render_system.canvas.width, render_system.canvas.height);
    render_system.render();

    if (tools.current_tool_name == MARKER_TOOL_NAME) {
        marker_tool.current_stroke?.do(render_system.context);
    }
});


// start new stroke
canvas.addEventListener("mousedown", (event) => {
    switch (tools.current_tool_name)  {
    case MARKER_TOOL_NAME:
        if (marker_tool.current_stroke === null) {
            marker_tool.current_stroke =
                    new MarkerStroke(marker_tool.thickness);
            marker_tool.current_stroke.push({x: event.offsetX, y: event.offsetY});
        }
        break;

    case STICKER_TOOL_NAME:
        render_system.add(new StickerStamp(sticker_tool.content,
                mouse_current!));
        break;
    }

    canvas.dispatchEvent(new Event(CANVAS_UPDATE_EVENT));
});

// during drawing
canvas.addEventListener("mousemove", (event) => {
    mouse_current = {x: event.offsetX, y: event.offsetY};
    switch (tools.current_tool_name)  {
    case MARKER_TOOL_NAME:
        if (marker_tool.current_stroke !== null) {
            marker_tool.current_stroke.push(mouse_current);
        }
    }

    canvas.dispatchEvent(new Event(CANVAS_UPDATE_EVENT));
});

// finish drawing
function finish_drawing_event_listener(_event: MouseEvent) {
    switch (tools.current_tool_name)  {
    case MARKER_TOOL_NAME:
        if (marker_tool.current_stroke !== null) {
            render_system.add(marker_tool.current_stroke!);
            marker_tool.current_stroke = null;
            canvas.dispatchEvent(new Event(CANVAS_UPDATE_EVENT));
        }

    }
}
canvas.addEventListener("mouseup", finish_drawing_event_listener);
canvas.addEventListener("mouseleave", finish_drawing_event_listener);
