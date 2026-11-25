/**
 * Cache Middleware for GET Request Interception
 * 
 * This middleware implements caching for GET requests only, providing:
 * - Cache key generation based on request URL and parameters
 * - Cache hit logic to return cached responses immediately
 * - Cache miss handling and response caching after database queries
 * - Proper TTL assignment based on endpoint type and configuration
 * - Tag assignment based on response data and endpoint patterns
 */

import { cacheService } from '../services/cache.js';
import { CACHE_CONFIG, CACHE_TYPES } from '../config/cache.config.js';

/**
 * Cache middleware for GET request interception
 * Only processes GET requests and provides transparent caching
 * 
 * @param {Object} options - Middleware configuration options
 * @param {string} options.cacheType - Cache type for TTL assignment (optional)
 * @param {Function} options.tagExtractor - Function to extract tags from request/response (optional)
 * @param {boolean} options.skipCache - Skip caching for this request (optional)
 * @returns {Function} Express middleware function
 */
export function cacheMiddleware(options = {}) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching if disabled or explicitly skipped
        if (!CACHE_CONFIG.ENABLED || options.skipCache) {
            return next();
        }

        try {
            // Generate cache key based on request URL and parameters
            const cacheKey = generateCacheKey(req, options.cacheType);

            // Skip caching if key generation returned null (e.g., unauthenticated user-specific route)
            if (!cacheKey) {
                return next();
            }

            // Check cache for existing data
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                // Cache hit - return cached response immediately
                if (CACHE_CONFIG.DEBUG.ENABLED && CACHE_CONFIG.DEBUG.LOG_CACHE_HITS) {
                    console.log('[CACHE HIT] %s %s', req.method, req.originalUrl);
                }

                // Set cache headers to indicate cached response
                res.set('X-Cache', 'HIT');
                if (CACHE_CONFIG.DEBUG.ENABLED) res.set('X-Cache-Key', cacheKey);

                const headers = { ...(cachedData.headers || {}) };

                // Return cached response with appropriate status and headers
                return res.status(cachedData.statusCode || 200)
                    .set(headers)
                    .json(cachedData.body);
            }

            // Cache miss - continue to next middleware and intercept response
            if (CACHE_CONFIG.DEBUG.ENABLED && CACHE_CONFIG.DEBUG.LOG_CACHE_MISSES) {
                console.log('[CACHE MISS] %s %s', req.method, req.originalUrl);
            }

            // Store original response methods for interception
            const originalSend = res.send;
            const originalJson = res.json;
            const originalStatus = res.status;
            let responseStatusCode = 200;
            let responseHeaders = {};
            let responseSent = false;


            // Override res.json to capture response data
            res.json = function (data) {
                if (!responseSent) {
                    responseSent = true;

                    // Cache the response after sending it
                    setImmediate(() => {
                        cacheResponse(req, {
                            statusCode: responseStatusCode,
                            headers: responseHeaders,
                            body: data
                        }, cacheKey, options);
                    });
                }

                // Set cache headers to indicate cache miss
                this.set('X-Cache', 'MISS');
                if (CACHE_CONFIG.DEBUG.ENABLED) this.set('X-Cache-Key', cacheKey);

                return originalJson.call(this, data);
            };

            // Override res.send to capture non-JSON responses
            res.send = function (data) {
                if (!responseSent) {
                    responseSent = true;

                    const contentType = this.get('Content-Type');

                    // Only cache JSON responses
                    if (contentType?.includes('application/json')) {
                        // Parse JSON string if needed
                        let bodyData = data;
                        if (typeof data === 'string') {
                            try {
                                bodyData = JSON.parse(data);
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }

                        setImmediate(() => {
                            cacheResponse(req, {
                                statusCode: responseStatusCode,
                                headers: responseHeaders,
                                body: bodyData
                            }, cacheKey, options);
                        });
                    }
                }

                // Set cache headers to indicate cache miss
                this.set('X-Cache', 'MISS');
                if (CACHE_CONFIG.DEBUG.ENABLED) this.set('X-Cache-Key', cacheKey);

                return originalSend.call(this, data);
            };

            // Continue to next middleware
            next();

        } catch (error) {
            // Log cache error but don't interrupt request flow
            console.log('Cache middleware error for %s %s:', req.method, req.originalUrl, error.message);
            next();
        }
    };
}

/**
 * Generate cache key based on request URL and parameters
 * 
 * @param {Object} req - Express request object
 * @param {string} cacheType - Optional cache type for key generation
 * @returns {string|null} Generated cache key or null if caching should be skipped
 */
function generateCacheKey(req, cacheType) {
    // The route as the code defines it, lowercased (Express matches /api/USER/stats to /api/user/stats), with the
    // values from the address filled in as they were sent (usernames are case-sensitive). So the address's letter
    // case doesn't make another copy.
    const pattern = req.route?.path;
    const path = (typeof pattern === 'string'
        ? `${req.baseUrl || ''}${pattern}`.toLowerCase().replace(/:(\w+)/g, (_, name) => encodeURIComponent(req.params?.[name] ?? ''))
        : `${req.baseUrl || ''}${req.path || ''}`
    ).replace(/\/+/g, '/');

    // Determine cache type from URL if not provided
    const type = cacheType || inferCacheTypeFromUrl(path.toLowerCase());

    // Generate identifier from path (remove leading slash and replace slashes with colons)
    let identifier = path.replace(/^\//, '').replace(/\//g, ':') || 'root';

    // A route for signed-in users only (req.signedInOnly, set by the auth checks) may return the user's own data, so
    // its key always holds the user's id (P0-08). This doesn't depend on a list of paths, or on how they're typed.
    if (req.signedInOnly) {
        const userId = req.token?.id;
        if (!userId) return null;
        identifier = `user:${userId}:${identifier}`;
    }

    // Use cache service to generate key with the query parameters the handlers read
    return cacheService.generateCacheKey(type, identifier, keyQuery(req.query));
}

// The query parameters handlers read. Any others are ignored by the handlers, so they're left out of the key too:
// otherwise `?page=1&x=1`, `?page=1&x=2`... would each store another copy of the same response.
const KEY_QUERY_PARAMS = ['category', 'id', 'page', 'search', 'skipLogs', 'view'];

function keyQuery(query = {}) {
    const picked = {};
    for (const name of KEY_QUERY_PARAMS) {
        if (query[name] !== undefined) picked[name] = query[name];
    }
    return picked;
}

/**
 * Infer cache type from URL path for TTL assignment
 * 
 * @param {string} path - URL path
 * @returns {string} Cache type
 */
function inferCacheTypeFromUrl(path) {
    // Map URL patterns to cache types
    if (path.includes('/user') || path.includes('/users')) {
        return CACHE_TYPES.USER;
    }
    if (path.includes('/card')) {
        return CACHE_TYPES.CARD;
    }
    if (path.includes('/review') || path.includes('/queue')) {
        return CACHE_TYPES.REVIEW_QUEUE;
    }
    if (path.includes('/search')) {
        return CACHE_TYPES.SEARCH;
    }

    // Default cache type
    return 'default';
}

/**
 * Cache the response data with appropriate TTL and tags
 * 
 * @param {Object} req - Express request object
 * @param {Object} responseData - Response data to cache
 * @param {string} cacheKey - Cache key
 * @param {Object} options - Middleware options
 */
async function cacheResponse(req, responseData, cacheKey, options) {
    try {
        // Only cache successful responses (2xx status codes) and only one 304 not modified request
        if (responseData.statusCode < 200 || (responseData.statusCode >= 300 && responseData.statusCode !== 304)) {
            return;
        }

        // Don't cache empty responses or errors
        if (!responseData.body || (typeof responseData.body === 'object' && responseData.body.error)) {
            return;
        }

        // Determine cache type and TTL
        const cacheType = options.cacheType || inferCacheTypeFromUrl(req.path);
        const ttl = cacheService.getTTLForType(cacheType);

        // Extract tags for cache invalidation
        const tags = extractTagsFromRequest(req, responseData, options.tagExtractor);

        // Cache the response
        const success = await cacheService.set(cacheKey, responseData, ttl, tags);

        if (CACHE_CONFIG.DEBUG.ENABLED && !success) {
            console.log('[CACHE] Failed to cache %s', req.originalUrl);
        }

    } catch (error) {
        console.log('Error caching response for %s:', req.originalUrl, error.message);
    }
}

/**
 * Extract cache tags from request and response for invalidation
 * 
 * @param {Object} req - Express request object
 * @param {Object} responseData - Response data
 * @param {Function} customTagExtractor - Custom tag extraction function
 * @returns {string[]} Array of cache tags
 */
function extractTagsFromRequest(req, responseData, customTagExtractor) {
    const tags = [];

    // Use custom tag extractor if provided
    if (typeof customTagExtractor === 'function') {
        try {
            const customTags = customTagExtractor(req, responseData);
            if (Array.isArray(customTags)) {
                tags.push(...customTags);
            }
        } catch (error) {
            console.log('Error in custom tag extractor:', error.message);
        }
    }

    // Extract standard tags based on URL patterns and response data. Lowercased, as routes match whatever the case.
    const fullPath = (req.originalUrl || `${req.baseUrl || ''}${req.path}`).toLowerCase();
    const params = req.params || {};
    const query = req.query || {};

    // Add base tags based on URL patterns
    if (fullPath.includes('/card')) {
        tags.push('Card');

        // Add specific card tags if card ID is present
        const cardId = params.id || params.cardId || query.cardId;
        if (cardId) {
            // Add view-specific tags based on query parameters
            const view = query.view;

            // Only add CardOverview tag for overview view or when no view is specified
            if (!view || view === 'overview') {
                tags.push(`CardOverview:${cardId}`);
            }

            if (view === 'edit_flashcards' || view === 'review' || view === 'review_text') {
                tags.push(`CardFlashcards:${cardId}`);
            }
            if (view === 'edit_quizzes' || view === 'quiz') {
                tags.push(`CardQuiz:${cardId}`);
            }
            if (view === 'review-queue' || fullPath.includes('/review-queue')) {
                tags.push(`CardReviewQueue:${cardId}`);
            }
        }

        // Extract category from response data for list caching
        if (responseData && responseData.body) {
            const body = responseData.body;
            // Handle single card response
            if (body.card && body.card.category) {
                tags.push(`CardCategory:${body.card.category}`);
            }
            // Handle array of cards response
            if (Array.isArray(body.cards)) {
                body.cards.forEach(card => {
                    if (card.category) {
                        tags.push(`CardCategory:${card.category}`);
                    }
                    if (card._id) {
                        tags.push(`CardOverview:${card._id}`);
                    }
                });
            }
            // Handle paginated response
            if (body.data && Array.isArray(body.data)) {
                body.data.forEach(card => {
                    if (card.category) {
                        tags.push(`CardCategory:${card.category}`);
                    }
                    if (card._id) {
                        tags.push(`CardOverview:${card._id}`);
                    }
                });
            }
        }

    }

    if (fullPath.includes('/user')) {
        // For user-specific routes, ONLY use user-specific tags to prevent cross-user invalidation
        const userId = req.token?.id || params.id || params.userId || query.userId;
        if (userId) {
            tags.push(`User:${userId}`);
        }
    }

    if (fullPath.includes('/reviewers')) {
        const cardId = params.id || params.cardId;
        if (cardId) {
            tags.push(`Reviewers:${cardId}`);
        }
    }

    // Remove duplicates and return
    return [...new Set(tags)];
}

/**
 * Create cache middleware with specific configuration for different route types
 */
export const createCacheMiddleware = {
    /**
     * Cache middleware for card routes
     */
    cards: (options = {}) => cacheMiddleware({
        cacheType: CACHE_TYPES.CARD,
        ...options
    }),

    /**
     * Cache middleware for user routes
     */
    users: (options = {}) => cacheMiddleware({
        cacheType: CACHE_TYPES.USER,
        ...options
    }),

    /**
     * Cache middleware for review queue routes
     */
    reviewQueue: (options = {}) => cacheMiddleware({
        cacheType: CACHE_TYPES.REVIEW_QUEUE,
        ...options
    }),

    /**
     * Cache middleware for search routes
     */
    search: (options = {}) => cacheMiddleware({
        cacheType: CACHE_TYPES.SEARCH,
        ...options
    }),

    /**
     * Generic cache middleware with auto-detection
     */
    auto: (options = {}) => cacheMiddleware(options)
};