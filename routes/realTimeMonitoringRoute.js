import {
  fetchRealTimeCurrentData,
  fetchMostRecentDataPoint,
} from "../services/realTimeMonitoringService.js";

export default function realTimeMonitoringRoute(fastify, db) {
  fastify.get(
    "/current-monitoring/:macAddress",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { macAddress } = req.params;
      let lastDataReceivedTime = new Date();

      const interval = setInterval(async () => {
        try {
          const currentTime = new Date();
          const data = await fetchRealTimeCurrentData(db, macAddress);

          // Check if data is not received for the last 5 minutes
          if (data.results === "No data available.") {
            const mostRecentData = await fetchMostRecentDataPoint(
              db,
              macAddress
            );
            const timeDifference =
              currentTime - new Date(mostRecentData.timestamp);

            const fiveMinutesInMillis = 5 * 60 * 1000;

            if (timeDifference > fiveMinutesInMillis) {
              connection.socket.send(
                JSON.stringify({
                  alert:
                    "No data received for the last 5 minutes. Last data at " +
                    mostRecentData.timestamp,
                  status: "warning",
                  average_current: 0.0,
                  total_current: 0.0,
                  timestamp: currentTime
                })
              );
            }
          } else {
            lastDataReceivedTime = currentTime;
            connection.socket.send(JSON.stringify(data));
          }
        } catch (error) {
          console.error("Error fetching data from MongoDB:", error);
        }
      }, 5000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );
}
