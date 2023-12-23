'use strict';

/**
 * analytic service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::analytic.analytic', {
  getUserAnalytics: async (ctx) => {
    try {
      const { id } = ctx.params;

      const user = await strapi.query('user', 'users-permissions').findOne({ id });

      if (!user) {
        return ctx.notFound('User not found');
      }

      const { processedRequests, averageRating, averageResolutionTime } = user;

      const analyticsData = {
        userId: user.id,
        processedRequests,
        averageRating,
        averageResolutionTime,
      };

      return ctx.send(analyticsData);
    } catch (error) {

      return ctx.send({ error: 'Внутренняя ошибка сервера' }, 500);
    }
  },
});
