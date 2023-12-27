"use strict";

/**
 * request service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::request.request", ({ strapi }) => ({
  async addWorkerToRequest() {
    let users = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: {
          role: {
            type: "worker",
          },
        },
        populate: {
          workRequests: true,
          profile: true,
        },
      });

    const availableRequests = await strapi.db
      .query("api::request.request")
      .findMany({
        where: {
          status: "active",
          userWorker: null,
        },
      });

    users = users.filter((user) => {
      return (
        user.profile &&
        user.profile[0].isActive &&
        !user.workRequests.filter((request) => {
          return request.status === "active";
        }).length
      );
    });

    if (!users.length || !availableRequests.length) return;

    for (let i = 0; i < users.length; i++) {
      if (!availableRequests[i]) return;

      await strapi.db.query("api::request.request").update({
        where: {
          id: availableRequests[i].id,
        },
        data: {
          userWorker: users[i].id,
        },
      });
    }
  },
}));
