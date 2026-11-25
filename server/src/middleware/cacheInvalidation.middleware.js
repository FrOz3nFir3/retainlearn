/**
 * Cache Invalidation Middleware for Mutation Operations
 * 
 * This middleware implements cache invalidation for POST/PATCH/DELETE requests,
 * providing intelligent tag-based cache deletion that mirrors RTK Query patterns.
 * 
 * Features:
 * - Only processes non-GET requests (mutations)
 * - Tag extraction logic based on request data and endpoint patterns
 * - Post-response cache invalidation for successful operations
 * - Complex invalidation patterns matching RTK Query behavior
 * - Conditional invalidation logic for specific scenarios
 */

import { cacheService } from '../services/cache.js';
import { invalidationUtils } from '../services/cacheInvalidation.js';
import { CACHE_CONFIG } from '../config/cache.config.js';

/**
 * Cache invalidation middleware for mutation operations
 * Processes POST/PATCH/PUT/DELETE requests and invalidates related cache entries
 * 
 * @param {Object} options - Middleware configuration options
 * @param {Function} options.tagExtractor - Custom function to extract tags from request/response
 * @param {boolean} options.skipInvalidation - Skip invalidation for this request
 * @param {string[]} options.staticTags - Static tags to always invalidate
 * @returns {Function} Express middleware function
 */
export function invalidationMiddleware(options = {}) {
    return async (req, res, next) => {
        // Only process non-GET requests (mutations)
        if (req.method === 'GET') {
            return next();
        }

        // Skip invalidation if disabled or explicitly skipped
        if (!CACHE_CONFIG.ENABLED || options.skipInvalidation) {
            return next();
        }

        try {
            // Store original response methods for interception
            const originalSend = res.send;
            const originalJson = res.json;
            let responseData = null;
            let responseSent = false;

            // Override res.json to capture response data
            res.json = function (data) {
                if (!responseSent) {
                    responseData = data;
                    responseSent = true;

                    // Perform cache invalidation after successful response
                    setImmediate(() => {
                        performCacheInvalidation(req, res, data, options);
                    });
                }

                return originalJson.call(this, data);
            };

            // Override res.send to capture non-JSON responses
            res.send = function (data) {
                if (!responseSent) {
                    responseData = data;
                    responseSent = true;

                    // Only invalidate for successful responses
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        setImmediate(() => {
                            performCacheInvalidation(req, res, data, options);
                        });
                    }
                }

                return originalSend.call(this, data);
            };

            // Continue to next middleware
            next();

        } catch (error) {
            // Log invalidation middleware error but don't interrupt request flow
            console.log('Cache invalidation middleware error for %s %s:', req.method, req.originalUrl, error.message);
            next();
        }
    };
}

/**
 * Perform cache invalidation based on request and response data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {any} responseData - Response data
 * @param {Object} options - Middleware options
 */
async function performCacheInvalidation(req, res, responseData, options) {
    try {
        // Only invalidate for successful responses (2xx status codes)
        if (res.statusCode < 200 || res.statusCode >= 300) {
            if (CACHE_CONFIG.DEBUG?.ENABLED) {
                console.log('[INVALIDATION] Skipped - non-2xx status: %s for %s %s', res.statusCode, req.method, req.originalUrl);
            }
            return;
        }

        // Extract tags to invalidate
        const tagsToInvalidate = await extractInvalidationTags(req, responseData, options);

        if (CACHE_CONFIG.DEBUG?.ENABLED) {
            console.log('[INVALIDATION] %s %s - Tags to invalidate:', req.method, req.originalUrl, tagsToInvalidate);
        }

        if (tagsToInvalidate.length === 0) {
            if (CACHE_CONFIG.DEBUG?.ENABLED) {
                console.log('[INVALIDATION] No tags to invalidate for %s %s', req.method, req.originalUrl);
            }
            return;
        }

        // Perform cache invalidation
        const invalidatedCount = await cacheService.invalidateByTags(tagsToInvalidate);

        // log invalidations (not just when DEBUG is enabled)
        if (CACHE_CONFIG.DEBUG.ENABLED) {
            console.log('[CACHE INVALIDATION] %s %s: %s keys invalidated for tags [%s]', req.method, req.originalUrl, invalidatedCount, tagsToInvalidate.join(', '));
        }


    } catch (error) {
        console.log('Error performing cache invalidation for %s:', req.originalUrl, error.message);
    }
}

/**
 * Extract cache tags to invalidate based on request and response
 * 
 * @param {Object} req - Express request object
 * @param {any} responseData - Response data
 * @param {Object} options - Middleware options
 * @returns {Promise<string[]>} Array of cache tags to invalidate
 */
async function extractInvalidationTags(req, responseData, options) {
    const tags = new Set();

    // Add static tags if provided
    if (options.staticTags && Array.isArray(options.staticTags)) {
        options.staticTags.forEach(tag => tags.add(tag));
    }

    // Use custom tag extractor if provided
    if (typeof options.tagExtractor === 'function') {
        try {
            const customTags = options.tagExtractor(req, responseData);
            if (Array.isArray(customTags)) {
                customTags.forEach(tag => tags.add(tag));
            }
        } catch (error) {
            console.log('Error in custom invalidation tag extractor:', error.message);
        }
    }

    // Extract standard invalidation tags based on endpoint patterns
    const standardTags = await extractStandardInvalidationTags(req, responseData);
    standardTags.forEach(tag => tags.add(tag));

    return Array.from(tags);
}

/**
 * Extract standard invalidation tags based on RTK Query patterns
 * With the card-update and review-queue tags from services/cacheInvalidation.js
 * 
 * @param {Object} req - Express request object
 * @param {any} responseData - Response data
 * @returns {Promise<string[]>} Array of standard cache tags to invalidate
 */
async function extractStandardInvalidationTags(req, responseData) {
    const tags = [];
    const path = req.path;
    const fullPath = req.originalUrl || `${req.baseUrl || ''}${req.path}`;
    const method = req.method;
    const cardId = invalidationUtils.extractCardId(req);
    // ALWAYS use req.token.id for security - this is signed by us and cannot be spoofed
    const userId = invalidationUtils.extractUserId(req);

    if (CACHE_CONFIG.DEBUG?.ENABLED) {
        console.log('[INVALIDATION EXTRACT] %s %s - userId: %s, cardId: %s', method, fullPath, userId, cardId);
    }

    // Card operations invalidation
    if (fullPath.includes('/card')) {
        if (method === 'POST' && fullPath.includes('/cards')) {
            // New card creation - invalidate all card lists
            tags.push('Card');
        }

        if (method === 'PATCH' && cardId) {
            // Card update - get tags from invalidation map (don't call service method here)
            const updateType = invalidationUtils.determineUpdateType(req.body);
            const { invalidationMap } = await import('../services/cacheInvalidation.js');
            const updateTags = invalidationMap.cardUpdate(cardId, updateType, req.body);
            tags.push(...updateTags);

            // Also invalidate category list if category is in the update
            if (req.body.category) {
                tags.push(`CardCategory:${req.body.category}`);
            }
        }

        if ((method === 'POST' || method === 'DELETE') && fullPath.includes('/reviewers')) {
            // Reviewer management
            if (cardId) {
                tags.push(`Reviewers:${cardId}`);
            }
        }

        if (method === 'POST' && fullPath.includes('/review-queue')) {
            // Review queue operations
            if (cardId) {
                if (fullPath.includes('/accept')) {
                    // Review queue acceptance - use invalidation service
                    const { invalidationMap } = await import('../services/cacheInvalidation.js');
                    const acceptTags = invalidationMap.reviewQueueAccept(cardId);
                    tags.push(...acceptTags);
                } else if (fullPath.includes('/reject')) {
                    // Review queue rejection - use same invalidation as accept
                    const { invalidationMap } = await import('../services/cacheInvalidation.js');
                    const rejectTags = invalidationMap.reviewQueueAccept(cardId);
                    tags.push(...rejectTags);
                }
            }
        }
    }

    // User operations invalidation
    if (fullPath.includes('/user')) {
        if (method === 'PATCH') {
            // A profile update - only invalidate this user's data. (Progress isn't cached here: the old progress
            // endpoints went with the old study screens.)
            if (userId) {
                tags.push(`User:${userId}`);
            }
        }

        if (method === 'POST') {
            if (fullPath.includes('/register') || fullPath.includes('/login')) {
                // User authentication - invalidate user cache
                tags.push('User');
            }
        }
    }

    return tags;
}



/**
 * Create invalidation middleware with specific configuration for different route types
 */
export const createInvalidationMiddleware = {
    /**
     * Invalidation middleware for card mutation routes
     */
    cards: (options = {}) => invalidationMiddleware({
        staticTags: ['Card'],
        ...options
    }),

    /**
     * Invalidation middleware for user mutation routes
     */
    users: (options = {}) => invalidationMiddleware({
        staticTags: ['User'],
        ...options
    }),

    /**
     * Invalidation middleware for review queue mutation routes
     */
    reviewQueue: (options = {}) => invalidationMiddleware({
        ...options
    }),

    /**
     * Generic invalidation middleware with auto-detection
     */
    auto: (options = {}) => invalidationMiddleware(options)
};