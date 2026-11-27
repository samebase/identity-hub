import { httpRouter } from "convex/server";
import { broker } from "./broker";
import { home } from "./home";

const http = httpRouter();
// An exact route wins over the broker's prefix routes.
http.route({ path: "/", method: "GET", handler: home });
broker.addHttpRoutes(http);

export default http;
