import express from "express";
import { generateSitemap } from "../controllers/sitemap.controller.js";

const sitemapRouter = express.Router();

// Defined at root of the router so it can be mounted where needed
sitemapRouter.get("/", generateSitemap);

export default sitemapRouter;
