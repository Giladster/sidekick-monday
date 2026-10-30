import { route } from "../lib/http.js";
import { draft } from "../lib/coach.js";

export default route(({ email, objections }) => draft(String(email || ""), Array.isArray(objections) ? objections.map(String) : []));
