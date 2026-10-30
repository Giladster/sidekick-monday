import { route } from "../lib/http.js";
import { DATA } from "../lib/library.js";

// Analytics stays mocked for the demo (sample data shaped like the real pool).
export default route(async () => DATA.insights);
