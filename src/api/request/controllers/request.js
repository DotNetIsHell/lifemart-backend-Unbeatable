"use strict";

/**
 * request controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::request.request", ({ strapi }) => ({
  async getCurrentRequest(ctx) {
    const request = await strapi.query("api::request.request").findOne({
      where: {
        $or: [
          {
            userWorker: null,
          },
          {
            userWorker: ctx.state.user.id,
          },
        ],
        status: "active",
      },
      populate: {
        userFrom: true,
      },
    });

    return { data: request };
  },
}));
