import {
  fetchRealTimeCurrentData,
  fetchMostRecentDataPoint,
  fetchRealTimeAmbientData,
  fetchRealTimeThermisterData,
  fetchRealTimeVibrationData,
  fetchRealTimeCTData
} from "../services/realTimeMonitoringService.js";

export default function realTimeMonitoringRoute(fastify, options, done) {
  // fastify.get(
  //   "/current-monitoring/:macAddress",
  //   { websocket: true },
  //   (connection, req) => {
  //     const { db } = options;
  //     const { macAddress } = req.params;
  //     let lastDataReceivedTime = new Date();
  //     let accumulatedData = []; // Define accumulatedData within the route handler scope
  
  //     const interval = setInterval(async () => {
  //       try {
  //         const currentTime = new Date();
  //         const data = await fetchRealTimeCurrentData(db, macAddress);
  
  //         if (data.status === "error") {
  //           // Handle error response
  //           connection.socket.send(JSON.stringify(data));
  //         } else {
  //           // If there is new data, append it to accumulatedData
  //           accumulatedData = accumulatedData.concat(data.results);
  //         }
  
  //         // Send accumulatedData to the client
  //         if (accumulatedData.length > 0) {
  //           connection.socket.send(JSON.stringify(accumulatedData));
  //           accumulatedData = []; // Clear accumulatedData after sending
  //         }
  //       } catch (error) {
  //         console.error("Error fetching data from MongoDB:", error);
  //       }
  //     }, 30000); // Refresh interval is 30 seconds
  
  //     connection.socket.on("close", () => {
  //       clearInterval(interval);
  //     });
  //   }
  // );

  fastify.get(
    "/current-monitoring/:macAddress",
    { websocket: true },
    (connection, req) => {
      const { db } = options;
      const { macAddress } = req.params;
      let lastDataReceivedTime = new Date();

      const interval = setInterval(async () => {
        try {
          const currentTime = new Date();
          const data = await fetchRealTimeCurrentData(db, macAddress);

          if (data.results === "No data available.") {
            const mostRecentData = await fetchMostRecentDataPoint(db, macAddress);
            const timeDifference = currentTime - new Date(mostRecentData.timestamp);
            const fiveMinutesInMillis = 5 * 60 * 1000;

            if (timeDifference > fiveMinutesInMillis) {
              connection.socket.send(
                JSON.stringify({
                  alert: "No data received for the last 5 minutes. Last data at " + mostRecentData.timestamp,
                  status: "warning",
                  total_current: 0.0,
                  timestamp: currentTime,
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
      }, 30000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/ambient-monitoring/:macAddress",
    { websocket: true },
    (connection, req) => {
      const { db } = options;
      const { macAddress } = req.params;

      const interval = setInterval(async () => {
        try {
          const data = await fetchRealTimeAmbientData(db, macAddress);
          connection.socket.send(JSON.stringify(data));
        } catch (error) {
          console.error("Error fetching ambient data from MongoDB:", error);
        }
      }, 30000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/thermister-monitoring/:macAddress",
    { websocket: true },
    (connection, req) => {
      const { db } = options;
      const { macAddress } = req.params;

      const interval = setInterval(async () => {
        try {
          const data = await fetchRealTimeThermisterData(db, macAddress);
          connection.socket.send(JSON.stringify(data));
        } catch (error) {
          console.error("Error fetching thermister data from MongoDB:", error);
        }
      }, 30000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/vibration-monitoring/:macAddress",
    { websocket: true },
    (connection, req) => {
      const { db } = options;
      const { macAddress } = req.params;

      const interval = setInterval(async () => {
        try {
          const data = await fetchRealTimeVibrationData(db, macAddress);
          connection.socket.send(JSON.stringify(data));
        } catch (error) {
          console.error("Error fetching vibration data from MongoDB:", error);
        }
      }, 30000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/ct-monitoring/:macAddress",
    { websocket: true },
    (connection, req) => {
      const { db } = options;
      const { macAddress } = req.params;

      const interval = setInterval(async () => {
        try {
          const data = await fetchRealTimeCTData(db, macAddress);
          connection.socket.send(JSON.stringify(data));
        } catch (error) {
          console.error("Error fetching CT data from MongoDB:", error);
        }
      }, 30000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  done();
}
