import "./style.css";

const APP_NAME = "HEY THIS IS GAME NAME";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;
