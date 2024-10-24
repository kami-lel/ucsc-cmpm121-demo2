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
