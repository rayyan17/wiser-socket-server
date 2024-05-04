import { fetchMachinesCurrentState, fetchRealTimeCurrentAlert, fetchRealTimeAmbientTempAlert, fetchRealTimeAmbientHumidityAlert, checkMachineStateAlerts } from "../services/realTimeAlertsService.js";
// ... (other imports)

export default function realTimeAlertsMonitoringRoute(fastify, options, done) {
  fastify.get(
    "/machine-state-monitoring/:labId",
    { websocket: true },
    async (connection /* SocketStream */, req /* FastifyRequest */) => {
       const { db } = options;
      const { labId } = req.params;

      const interval = setInterval(async () => {
        try {
          const machineData = await fetchMachinesCurrentState(db, labId);
          connection.socket.send(JSON.stringify(machineData));
        } catch (error) {
          console.error("Error fetching machine data from MongoDB:", error);
        }
      }, 5000);

      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/total-current-threshold-alert/:macAddress",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { db } = options;
      const { macAddress } = req.params;
  
      const interval = setInterval(async () => {
        try {
          const currentTime = new Date();
          const data = await fetchRealTimeCurrentAlert(db, macAddress);
  
          if (data.results !== "No data available.") {
            const totalCurrent = parseFloat(data.total_current);
            const faultThreshold = parseFloat(data.fault_threshold);
  
            if (totalCurrent > faultThreshold) {
              const alertData = {
                alert: `Total current exceeded threshold. Current value: ${totalCurrent}`,
                status: "alert",
                total_current: totalCurrent,
                timestamp: currentTime,
              };
              connection.socket.send(JSON.stringify(alertData));
  
              // Store the alert in the database
              await db.collection("alerts").insertOne({
                macAddress: macAddress,
                alert: `Current`,
                total_current: totalCurrent,
                fault_threshold: faultThreshold,
                timestamp: new Date() // Record the exact time of the alert storage
              });
            }
          }
        } catch (error) {
          console.error("Error fetching total current data from MongoDB:", error);
        }
      }, 5000);
  
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/real-time-ambient-temp-alert/:macAddress",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { db } = options;
      const { macAddress } = req.params;
  
      const interval = setInterval(async () => {
        try {
          const alertData = await fetchRealTimeAmbientTempAlert(db, macAddress);
  
          if (alertData.status !== "error") {
            connection.socket.send(JSON.stringify(alertData));
          }
        } catch (error) {
          console.error("Error fetching real-time ambient temperature alert:", error);
        }
      }, 5000);
  
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/real-time-ambient-humidity-alert/:macAddress",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { db } = options;
      const { macAddress } = req.params;
  
      const interval = setInterval(async () => {
        try {
          const alertData = await fetchRealTimeAmbientHumidityAlert(db, macAddress);
  
          if (alertData.status !== "error") {
            connection.socket.send(JSON.stringify(alertData));
          }
        } catch (error) {
          console.error("Error fetching real-time ambient humidity alert:", error);
        }
      }, 5000);
  
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  fastify.get(
    "/machine-state-alerts/:labId",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      const { db } = options;
      const { labId } = req.params;
  
      const sendAlerts = (alerts) => {
        for (const alert of alerts) {
          connection.socket.send(JSON.stringify(alert));
        }
      };
  
      const interval = setInterval(async () => {
        try {
          const alerts = await checkMachineStateAlerts(db, labId);
          sendAlerts(alerts);
        } catch (error) {
          console.error("Error checking machine state alerts:", error);
          connection.socket.send(JSON.stringify({ type: "error", message: "An error occurred." }));
        }
      }, 5000); 
  
      connection.socket.on("close", () => {
        clearInterval(interval);
      });
    }
  );

  done();
}
