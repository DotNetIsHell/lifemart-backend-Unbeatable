module.exports = ({ env }) => ({
  transformer: {
    enabled: true,
    config: {
      responseTransforms: {
        removeAttributesKey: true,
        removeDataKey: true,
      },
      requestTransforms: {
        wrapBodyWithDataKey: false,
      },
      plugins: {
        ids: {
          slugify: true,
        },
      },
    },
  },
});
