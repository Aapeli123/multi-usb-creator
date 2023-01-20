import { render } from "preact";
import { App } from "./app";
import "./index.css";
import "preact/debug"; // <-- Add this line at the top of your main entry file

render(<App />, document.getElementById("app") as HTMLElement);
