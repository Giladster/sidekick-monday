import { route } from "../lib/http.js";
import { find } from "../lib/coach.js";

export default route(({ text }) => find(String(text || "").slice(0, 20000)));
