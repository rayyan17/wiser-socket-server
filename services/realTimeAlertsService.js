import { ObjectId } from "mongodb";

export async function fetchMachinesCurrentState(db, labId) {
  const machinesCursor = db.collection("machines").find({ labId: new ObjectId(labId) });

  const machines = await machinesCursor.toArray();
  const results = [];

  for (const machine of machines) {
    let state = null;
    let timestamp = null;

    if (machine.nodeId) {
      try {
        const node = await db.collection("nodes").findOne({ _id: machine.nodeId });
        const macAddress = node.mac;
        
        // Update the query to filter by state directly
        const ct = await db
          .collection("cts")
          .findOne({ mac: macAddress, state: { $in: ["OFF", "IDLE"] } }, { state: 1,  created_at: 1,_id: 0 });

        if (ct) {
          state = ct.state
          timestamp = ct.created_at
        }
      } catch (error) {
        console.error("Error querying node or cts collection:", error);
      }
      const machineData = {
        machine: machine,
        state: state,
        timestamp: timestamp
      };

      results.push(machineData);
    }
  }

  return results;
}

export async function fetchRealTimeCurrentAlert(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 15 * 1000); // 15 seconds ago, corrected for clarity

  try {
    const collection = db.collection('cts'); // Correct collection name used

    const result = await collection
      .aggregate([
        {
          $match: { created_at: { $gte: startTime, $lte: currentTime }, mac: macAddress }
        },
        {
          $lookup: {
            from: "nodes", // Correctly assuming the nodes collection name is 'nodes'
            localField: "mac",
            foreignField: "mac",
            as: "nodeInfo"
          }
        },
        {
          $unwind: "$nodeInfo" // Unwind the array to facilitate easier data manipulation
        },
        {
          $project: {
            _id: 0,
            total_current: { $round: ["$total_current", 2] },
            timestamp: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S.%LZ",
                date: "$created_at",
              },
            },
            fault_threshold: "$nodeInfo.ct.fault_threshold" // Assuming the structure inside nodeInfo document
          },
        },
        {
          $limit: 1,
        },
      ])
      .toArray();

    if (result.length === 0) {
      return {
        results: "No data available.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching total current data from MongoDB:", error);
    throw error; // Ensure that any consuming functions are aware of the failure
  }
}

export async function fetchRealTimeAmbientTempAlert(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 15 * 1000); // 15 seconds ago

  try {
    const ambientData = await db.collection('ambients').findOne({ mac: macAddress, created_at: { $gte: startTime, $lte: currentTime } });
    
    if (!ambientData) {
      return {
        results: "No ambient temperature data available.",
        status: "error",
      };
    }

    const node = await db.collection('nodes').findOne({ mac: macAddress });
    const threshold = node?.ambient?.temp_threshold?.max;

    if (!threshold) {
      return {
        results: "No ambient temperature threshold available for the node.",
        status: "error",
      };
    }

    const ambientTemp = ambientData.amb_temp;
    const timestamp = ambientData.created_at;

    if (ambientTemp > threshold) {
      const alertData = {
        alert: `Ambient temperature exceeded threshold. Current temperature: ${ambientTemp}`,
        status: "alert",
        ambient_temp: ambientTemp,
        threshold: threshold,
        timestamp: timestamp,
      };

      // Save the alert in the database
      await db.collection("alerts").insertOne({
        macAddress: macAddress,
        alert: "Ambient_Temp",
        ambient_temp: ambientTemp,
        threshold: threshold,
        timestamp: new Date() // Record the exact time of the alert storage
      });

      return alertData;
    } else {
      return {
        results: "Ambient temperature within threshold.",
        status: "info",
      };
    }
  } catch (error) {
    console.error("Error fetching real-time ambient temperature data:", error);
    throw error;
  }
}

export async function fetchRealTimeAmbientHumidityAlert(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 15 * 1000); // 15 seconds ago

  try {
    const ambientData = await db.collection('ambients').findOne({ mac: macAddress, created_at: { $gte: startTime, $lte: currentTime } });
    
    if (!ambientData) {
      return {
        results: "No ambient humidity data available.",
        status: "error",
      };
    }

    const node = await db.collection('nodes').findOne({ mac: macAddress });
    const threshold = node?.ambient?.humidity_threshold?.max;

    if (!threshold) {
      return {
        results: "No ambient humidity threshold available for the node.",
        status: "error",
      };
    }

    const ambientHumidity = ambientData.ambient_humidity;
    const timestamp = ambientData.created_at;

    if (ambientHumidity > threshold) {
      const alertData = {
        alert: `Ambient humidity exceeded threshold. Current humidity: ${ambientHumidity}`,
        status: "alert",
        ambient_humidity: ambientHumidity,
        threshold: threshold,
        timestamp: timestamp,
      };

      // Save the alert in the database
      await db.collection("alerts").insertOne({
        macAddress: macAddress,
        alert: "Ambient_Humidity",
        ambient_humidity: ambientHumidity,
        threshold: threshold,
        timestamp: new Date() // Record the exact time of the alert storage
      });

      return alertData;
    } else {
      return {
        results: "Ambient humidity within threshold.",
        status: "info",
      };
    }
  } catch (error) {
    console.error("Error fetching real-time ambient humidity data:", error);
    throw error;
  }
}

export async function checkMachineStateAlerts(db, labId) {
  try {
    const alerts = [];

    const machines = await db.collection("machines").find({ labId: new ObjectId(labId) }).toArray();
    console.log(machines);

    for (const machine of machines) {
      const { nodeId } = machine;
      if (!nodeId) {
        console.log(`Node not found for machine with labId ${labId}`);
        continue;
      }

      const nodes = await db.collection("nodes").find({ _id: nodeId }).toArray();
      for (const node of nodes) {
        const { mac: macAddress } = node;
        console.log(macAddress);

        const latestEntry = await db.collection("cts").findOne(
          { mac: macAddress },
          { sort: { created_at: -1 } }
        );
        console.log(latestEntry);

        if (!latestEntry) {
          alerts.push({
            alert: "Machine turned off",
            status: "error",
            macAddress: macAddress,
            timestamp: new Date(),
            message: `Machine with MAC ${macAddress} has no data.`,
          });
          continue;
        }

        const currentTime = new Date();
        console.log(currentTime);
        const entryTime = new Date(latestEntry.created_at);
        console.log(entryTime);
        const timeDifference = (currentTime - entryTime) / (1000 * 60);
        console.log(timeDifference);

        if (timeDifference > 1) {
          alerts.push({
            alert: "Node turned off",
            status: "error",
            macAddress: macAddress,
            timestamp: new Date(),
            message: `Machine with MAC ${macAddress} has its node turned off.`,
          });
        } else {
          const previousEntry = await db.collection("cts").findOne(
            { mac: macAddress, created_at: { $lt: latestEntry.created_at } },
            { sort: { created_at: -1 } }
          );

          if (previousEntry && previousEntry.state !== latestEntry.state) {
            alerts.push({
              alert: "State change",
              status: "info",
              macAddress: macAddress,
              timestamp: new Date(),
              message: `Machine with MAC ${macAddress} changed its state from ${previousEntry.state} to ${latestEntry.state}.`,
            });
          }

          const recentEntries = await db.collection("cts").find({
            mac: macAddress,
            created_at: { $gte: new Date(currentTime.getTime() - 5 * 60 * 1000) } 
          }).toArray();

          const recentStates = recentEntries.map(entry => entry.state);
          const isRecentOffOrIdle = recentStates.every(state => state === "OFF" || state === "IDLE");

          if (isRecentOffOrIdle) {
            const recentState = recentStates[0];
            alerts.push({
              alert: "Machine state",
              status: "info",
              macAddress: macAddress,
              timestamp: new Date(),
              message: `Machine with MAC ${macAddress} state is ${recentState} for entries within the recent 5 minutes.`,
            });
          }
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error checking machine state alerts:", error);
    throw error;
  }
}
