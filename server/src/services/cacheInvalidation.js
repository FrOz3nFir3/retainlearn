/**
 * Cache invalidation helpers for the old study set editor's writes (middleware/cacheInvalidation.middleware.js): which
 * cache tags a card update or a review-queue decision invalidates, and the ids a request carries. The old progress
 * endpoints, and their tags and service, went with the old study screens; the Redis cache's rules are reworked in
 * P1-10 (PLAN 14.11).
 */

export const invalidationMap = {
    /**
     * Card update with auto-detection (from patchUpdateCard)
     * Automatically detects the type of update and invalidates appropriate caches
     * @param {string} cardId - Card ID
     * @param {string} updateType - Type of update: 'flashcards', 'quiz', 'overview', or 'auto'
     * @param {Object} updateData - The actual update data for auto-detection
     * @returns {string[]} Tags to invalidate
     */
    cardUpdate: (cardId, updateType = 'auto', updateData = {}) => {
        const tags = [];

        let detectedType = updateType;

        // Auto-detect update type if not specified
        if (updateType === 'auto') {
            // Check for flashcard updates (question, answer fields, reordering)
            if (updateData.question || updateData.answer || updateData.flashcardId || updateData.deleteFlashcard || updateData.reorderFlashcards) {
                detectedType = 'flashcards';
            }
            // Check for quiz updates (quizQuestion, quizAnswer, options, reordering, etc.)
            else if (updateData.quizQuestion || updateData.quizAnswer || updateData.options || updateData.option || updateData.minimumOptions || updateData.quizId || updateData.deleteQuiz || updateData.reorderQuizzes) {
                detectedType = 'quiz';
            }
            // Check for overview/metadata updates
            else if (updateData['main-topic'] || updateData['sub-topic'] || updateData.description || updateData.category) {
                detectedType = 'overview';
            }
        }

        // Apply type-specific invalidation
        if (detectedType === 'flashcards') {
            // Only invalidate flashcard-related caches
            tags.push(`CardFlashcards:${cardId}`);
        } else if (detectedType === 'quiz') {
            // Only invalidate quiz-related caches
            tags.push(`CardQuiz:${cardId}`,);
        }

        // Overview changes happens always
        tags.push(`CardOverview:${cardId}`);

        // Always invalidate review queue later do this based on response body
        tags.push(`CardReviewQueue:${cardId}`);

        return tags;
    },

    /**
     * Review queue acceptance invalidation
     * When a review is accepted, it affects multiple aspects of the card
     * @param {string} cardId - Card ID
     * @returns {string[]} Tags to invalidate
     */
    reviewQueueAccept: (cardId) => [
        `CardReviewQueue:${cardId}`,
        `CardOverview:${cardId}`,
        `CardFlashcards:${cardId}`,
        `CardQuiz:${cardId}`,
        'Card'
    ],
};

/**
 * Utility functions for extracting invalidation parameters from requests
 */
export const invalidationUtils = {
    /**
     * Extract card ID from various request sources
     * @param {Object} req - Express request object
     * @returns {string|null} Card ID
     */
    extractCardId(req) {
        return req.params.id || req.body._id || req.params.cardId || req.body.cardId || req.query.cardId || null;
    },

    /**
     * Extract user ID from various request sources
     * @param {Object} req - Express request object
     * @returns {string|null} User ID
     */
    extractUserId(req) {
        return (req.token.id || null);
    },

    /**
     * Determine update type from request data
     * @param {Object} updateData - Update data from request body
     * @returns {string} Update type: 'flashcards', 'quiz', 'overview', or 'unknown'
     */
    determineUpdateType(updateData) {
        // Check for flashcard updates (question, answer fields)
        if (updateData.question || updateData.answer || updateData.flashcardId || updateData.deleteFlashcard || updateData.reorderFlashcards) {
            return 'flashcards';
        }
        // Check for quiz updates (quizQuestion, quizAnswer, options, etc.)
        if (updateData.quizQuestion || updateData.quizAnswer || updateData.options || updateData.option || updateData.minimumOptions || updateData.quizId || updateData.deleteQuiz || updateData.reorderQuizzes) {
            return 'quiz';
        }
        // Check for overview/metadata updates
        if (updateData['main-topic'] || updateData['sub-topic'] || updateData.description || updateData.category) {
            return 'overview';
        }
        return 'unknown';
    }
};
