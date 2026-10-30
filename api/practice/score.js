import { route } from "../../lib/http.js";
import { score } from "../../lib/coach.js";

export default route(({ objection, reply }) =>
  score(String(objection || "").slice(0, 1000), String(reply || "").slice(0, 3000)));
