import { route } from "../lib/http.js";
import { answer } from "../lib/coach.js";

export default route(({ text }) => answer(String(text || "").slice(0, 2000)));
