import { route } from "../lib/http.js";
import { rewrite } from "../lib/coach.js";

export default route(({ quote, answer, request }) => rewrite(String(quote || ""), String(answer || ""), String(request || "")));
