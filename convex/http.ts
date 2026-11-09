import { httpRouter } from "convex/server";
import { broker } from "./broker";

const http = httpRouter();
broker.addHttpRoutes(http);

export default http;
