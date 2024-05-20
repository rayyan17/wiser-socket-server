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

export async function fetchRealTimeAlerts(db, userId, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 15 * 1000); 

  try {
    const userIdObj = new ObjectId(userId);
    const lab = await db.collection('labs').findOne({ user_id: { $in: [userIdObj] } });

    if (!lab) {
      return {
        results: "Invalid user.",
        status: "error",
      };
    }

    const node = await db.collection('nodes').findOne({ mac: macAddress });
    if (!node) {
      return {
        results: "Node not found for the given MAC address.",
        status: "error",
      };
    }

    const machineInfo = await db.collection('machines').findOne({ labId: lab._id, nodeId: node._id });
    if (!machineInfo) {
      return {
        results: "No machine found for the given MAC address.",
        status: "error",
      };
    }

    const currentAlert = await fetchRealTimeCurrentAlert(db, userId, macAddress, startTime, currentTime, node, machineInfo);
    const ambientTempAlert = await fetchRealTimeAmbientTempAlert(db, userId, macAddress, startTime, currentTime, node, machineInfo);
    const ambientHumidityAlert = await fetchRealTimeAmbientHumidityAlert(db, userId, macAddress, startTime, currentTime, node, machineInfo);

    return {
      currentAlert,
      ambientTempAlert,
      ambientHumidityAlert
    };
  } catch (error) {
    console.error("Error fetching real-time alerts:", error);
    throw error;
  }
}

async function fetchRealTimeCurrentAlert(db, userId, macAddress, startTime, currentTime, node, machineInfo) {
  const currentInfo = await db.collection('cts')
    .find({ mac: macAddress, created_at: { $gte: startTime, $lte: currentTime } })
    .sort({ created_at: -1 })
    .limit(1)
    .next();

  if (!currentInfo) {
    return {
      results: "No current data available for the node within the specified time range.",
      status: "error",
    };
  }

  const total_current = currentInfo.total_current;
  // console.log(total_current)

  if (total_current > node.ct.fault_threshold) {
    await saveAlert(db, userId, macAddress, machineInfo.machineName, `Total current exceeded threshold. Total Current: ${total_current}`, 'Current_Threshold', currentTime, node._id);
    return {
      message: `Total current exceeded threshold. Total Current: ${total_current}`,
      type: "Current",
      timestamp: currentTime,
      machine_name: machineInfo.machineName,
      nodeId: node._id
    };
  } else {
    return {
      results: "Total current within threshold.",
      status: "info",
      machine_name: machineInfo.machineName,
      nodeId: node._id
    };
  }
}

async function fetchRealTimeAmbientTempAlert(db, userId, macAddress, startTime, currentTime, node, machineInfo) {
  const threshold = node?.ambient?.temp_threshold?.max;
  if (!threshold) {
    return {
      results: "No ambient temperature threshold available for the node.",
      status: "error",
    };
  }

  const ambientData = await db.collection('ambients')
    .find({ mac: macAddress, created_at: { $gte: startTime, $lte: currentTime } })
    .sort({ created_at: -1 })
    .limit(1)
    .next();

  if (!ambientData) {
    return {
      results: "No ambient temperature data available.",
      status: "error",
    };
  }

  const ambientTemp = ambientData.amb_temp;

  if (ambientTemp > threshold) {
    await saveAlert(db, userId, macAddress, machineInfo.machineName, `Ambient temperature exceeded threshold. Ambient Temperature: ${ambientTemp}`, 'Ambient_Temp', currentTime, node._id);
    return {
      message: `Ambient temperature exceeded threshold. Ambient Temperature: ${ambientTemp}`,
      type: "Ambient_Temp",
      timestamp: currentTime,
      machine_name: machineInfo.machineName,
      nodeId: node._id
    };
  } else {
    return {
      results: "Ambient temperature within threshold.",
      status: "info",
      machine_name: machineInfo.machineName,
      nodeId: node._id
    };
  }
}

async function fetchRealTimeAmbientHumidityAlert(db, userId, macAddress, startTime, currentTime, node, machineInfo) {
  const threshold = node?.ambient?.humidity_threshold?.max;
  if (!threshold) {
    return {
      results: "No ambient humidity threshold available for the node.",
      status: "error",
    };
  }

  const ambientData = await db.collection('ambients')
    .find({ mac: macAddress, created_at: { $gte: startTime, $lte: currentTime } })
    .sort({ created_at: -1 })
    .limit(1)
    .next();

  if (!ambientData) {
    return {
      results: "No ambient humidity data available.",
      status: "error",
    };
  }

  const ambientHumidity = ambientData.ambient_humidity;

  if (ambientHumidity > threshold) {
    await saveAlert(db, userId, macAddress, machineInfo.machineName, `Ambient humidity exceeded threshold. Ambient Humidity: ${ambientHumidity}`, 'Ambient_Humidity', currentTime, node._id);
    return {
      message: `Ambient humidity exceeded threshold. Ambient Humidity: ${ambientHumidity}`,
      type: "Ambient_Humidity",
      timestamp: currentTime,
      machine_name: machineInfo.machineName,
      nodeId: node._id
    };
  } else {
    return {
      results: "Ambient humidity within threshold.",
      status: "info",
      machine_name: machineInfo.machineName,
      nodeId: node._id
    };
  }
}

async function saveAlert(db, userId, macAddress, machineName, message, type, timestamp, nodeId) {
  await db.collection("alerts").insertOne({
    nodeId: nodeId,
    userId: userId,
    macAddress: macAddress,
    machineName: machineName,
    message: message,
    type: type,
    timestamp: timestamp
  });
}


export async function checkMachineStateAlerts(db, labId) {
  try {
    const alerts = [];

    const lab = await db.collection("labs").findOne({ _id: new ObjectId(labId) });
    if (!lab) {
      console.log(`Lab with ID ${labId} not found.`);
      return alerts;
    }
    // console.log(lab)

    const userId = lab.user_id;
    // console.log(userId)

    const machines = await db.collection("machines").find({ labId: new ObjectId(labId) }).toArray();
    // console.log(machines)

    for (const machine of machines) {
      const { nodeId, machineName } = machine;

      if (!nodeId) {
        console.log(`Node not found for machine with labId ${labId}`);
        continue;
      }

      const node = await db.collection("nodes").findOne({ _id: new ObjectId(nodeId) });
      if (!node) {
        console.log(`Node not found for machine with labId ${labId} and nodeId ${nodeId}`);
        continue;
      }

      const { mac: macAddress } = node;

      const latestEntry = await db.collection("cts").findOne(
        { mac: macAddress },
        { sort: { created_at: -1 } }
      );

      if (!latestEntry) {
        const alert = {
          nodeId: nodeId,
          userId: userId,
          macAddress: macAddress,
          machineName: machineName,
          message: `Machine with MAC ${macAddress} has no data.`,
          type: "Machine_Turned_Off",
          timestamp: new Date()
        };

        alerts.push(alert);
        await db.collection("alerts").insertOne(alert);
        continue;
      }

      const currentTime = new Date();
      const entryTime = new Date(latestEntry.created_at);
      const timeDifference = (currentTime - entryTime) / (1000 * 60);

      if (timeDifference > 2) {
        const alert = {
          nodeId: nodeId,
          userId: userId,
          macAddress: macAddress,
          machineName: machineName,
          message: `Machine with MAC ${macAddress} has its node turned off.`,
          type: "Node_Turned_Off",
          timestamp: new Date()
        };

        alerts.push(alert);
        await db.collection("alerts").insertOne(alert);
      } else {
        const previousEntry = await db.collection("cts").findOne(
          { 
            mac: macAddress, 
            created_at: { 
              $lt: new Date(latestEntry.created_at.getTime() - 5 * 1000) 
            } 
          },
          { sort: { created_at: -1 } }
        );

        if (previousEntry && previousEntry.state !== latestEntry.state) {
          const alert = {
            nodeId: nodeId,
            userId: userId,
            macAddress: macAddress,
            machineName: machineName,
            message: `Machine with MAC ${macAddress} changed its state from ${previousEntry.state} to ${latestEntry.state}.`,
            type: "State_Change",
            timestamp: new Date()
          };

          alerts.push(alert);
          await db.collection("alerts").insertOne(alert);
        }
      }
      console.log(alerts)
    }

    return alerts;
  } catch (error) {
    console.error("Error checking machine state alerts:", error);
    throw error;
  }
}
