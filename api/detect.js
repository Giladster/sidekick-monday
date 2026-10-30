import { route } from "../lib/http.js";
import { detect } from "../lib/coach.js";

export default route(({ line }) => detect(String(line || "").slice(0, 1000)));
