module.exports = {
    async getUserAnalytic (){
      return[]
    }
  }
  const { forEach } = require("../../../../config/middlewares");

  function getZeroDate (dateStr) {
    return dateStr.split("T")[0] + "T00:00:00.000Z"
  }

  module.exports = {
    async getUserAnalytic (ctx){
      const id = ctx.params.id;
      if (!id) return

      const user = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            where: { id },
            populate: {
              role: true,
              workRequests: true,
            },
          });

      let totalRequests = 0;
      let averageRequestDuration = 0;
      const graphData = {};

      let totalTime = 0;
      let finishedRequestsCount = 0;

      for (const request of user.workRequests) {
        if (request.status !== 'finished') {
          continue;  // Пропустить запросы с другим статусом
        }

        const date = getZeroDate(request.createdAt);
        if (!graphData[date]) {
          graphData[date] = [0, []];
        }

        graphData[date][0]++;
        let time = new Date(request.updatedAt).getTime() - new Date(request.createdAt).getTime();
        time = time / 1000 / 60;
        totalTime += time;
        graphData[date][1] = totalTime / graphData[date][0];

        totalRequests++;
        averageRequestDuration += time;
        finishedRequestsCount++;
      }

      // Проверка, чтобы избежать деления на 0
      if (finishedRequestsCount > 0) {
        averageRequestDuration /= finishedRequestsCount;
      }

      // {
      //   analytic: {
      //     totalRequests: 5,
      //     averageRequestsDuration: 2.5,
      //     graphData: {
      //       "2023-12-24T00:00:00.000Z": [0, 0]
      //     },
      //   }
      // }
      return {
        analytic: {
          totalRequests,
          averageRequestDuration,
          graphData,
        }
      };
    }
  }
