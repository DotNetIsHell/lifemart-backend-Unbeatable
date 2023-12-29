module.exports = {
  routes: [
    {
      method: "GET",
      path: "/analytic/:id",
      handler: "analytic.getUserAnalytic",
    },
  ],
};
