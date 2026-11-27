import Card from "../models/cards/cards.mongo.js";
import { listedFilter } from "../models/cards/cards.model.js";
import Path from "../models/paths/paths.mongo.ts";

// Helper to escape special XML characters
const escapeXml = (unsafe) => {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// Helper to normalize category name for URL matching the frontend helper
const normalizeCategory = (categoryName) => {
  if (!categoryName) return "";
  const parts = categoryName.split(" ");
  return parts
    .map((part) => {
      // Find the first alphanumeric character
      const firstAlphaNumIndex = part.search(/[a-zA-Z0-9]/);
      if (firstAlphaNumIndex === -1) return part; // No alphanumeric char found

      return (
        part.slice(0, firstAlphaNumIndex) +
        part.charAt(firstAlphaNumIndex).toUpperCase() +
        part.slice(firstAlphaNumIndex + 1).toLowerCase()
      );
    })
    .join(" ");
};

export const generateSitemap = async (req, res) => {
  try {
    // ⚠️ SCALING NOTE (Future Forward-Thinking):
    // A single sitemap.xml file has a hard limit of 50,000 URLs or 50MB uncompressed limit.
    // Right now, this queries all categories and all cards.
    // When the database approaches 40,000+ public cards, this endpoint must be refactored 
    // to use a "Sitemap Index" pattern with paginated sitemaps.
    // Example: /api/sitemap-index.xml -> links to -> /api/sitemap/cards.xml?page=1, /api/sitemap/cards.xml?page=2, etc.

    // We need all unique categories and all cards to build URLs.
    // MongoDB aggregation to get unique categories and their latest update time.
    // Listed sets only (P0-14): a new account's sets join once the account is trusted.
    const listed = listedFilter();
    const categoriesPipeline = [
      { $match: listed },
      {
        $group: {
          _id: "$category",
          lastMod: { $max: "$updatedAt" },
        },
      },
    ];
    const uniqueCategories = await Card.aggregate(categoriesPipeline);

    // Fetch all cards for individual URLs
    // Only fetching necessary fields to keep memory usage low
    const allCards = await Card.find(listed, "_id updatedAt").lean();
    // Skill paths (P2-07, decision 10): the public ones, listed (as sets: a new account's join once it's trusted, and
    // reported ones leave), not deleted.
    const paths = await Path.find({ visibility: "public", deletedAt: null, ...listed }, "_id contentAt").lean();

    const baseUrl = process.env.BASE_URL || "https://retainlearn.com";

    // Start building XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Static Routes
    const staticRoutes = [
      { url: "/", priority: 1.0, changefreq: "weekly" },
      { url: "/subjects", priority: 0.8, changefreq: "weekly" },
      { url: "/paths", priority: 0.7, changefreq: "weekly" },
    ];

    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${route.url}</loc>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Dynamic Category Routes
    uniqueCategories.forEach((cat) => {
      // Safety check just in case a category is null/undefined
      if (!cat._id) return;
      const normalizedCat = normalizeCategory(cat._id);
      // encodeURI handles spaces and standard special characters for URLs
      const catUrl = `${baseUrl}/subjects/${encodeURIComponent(normalizedCat)}`;

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(catUrl)}</loc>\n`;
      if (cat.lastMod) {
        xml += `    <lastmod>${cat.lastMod.toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    // 3. Dynamic Individual Card Routes
    allCards.forEach((card) => {
      const cardUrl = `${baseUrl}/study-sets/${card._id}`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(cardUrl)}</loc>\n`;
      if (card.updatedAt) {
        xml += `    <lastmod>${card.updatedAt.toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    // 4. Skill paths
    paths.forEach((path) => {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}/paths/${path._id}`)}</loc>\n`;
      if (path.contentAt) {
        xml += `    <lastmod>${path.contentAt.toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
};
