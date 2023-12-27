module.exports = {
  routes: [
    {
      method: "GET",
      path: "/requests/current",
      handler: "request.getCurrentRequest",
    },
  ],
};
