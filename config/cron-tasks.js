module.exports = {
  "*/1 * * * *": async ({ strapi }) => {
    console.log("CRON WORK");
    strapi.service("api::request.request").addWorkerToRequest();
  },
};
