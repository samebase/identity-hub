import { httpRouter } from "convex/server";
import { hub } from "./broker";

const http = httpRouter();
hub.addHttpRoutes(http);

export default http;
