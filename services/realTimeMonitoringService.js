// export async function fetchRealTimeCurrentData(db, macAddress) {
//   const currentTime = new Date();
//   const startTime = new Date(currentTime.getTime() - 100 * 1000);
//   try {
//     const collection = db.collection('cts');

//     const result = await collection
//       .find({
//         created_at: { $gte: startTime, $lte: currentTime },
//         mac: macAddress,
//       })
//       .sort({ created_at: -1 })
//       .limit(25)
//       .project({
//         _id: 0,
//         total_current: { $round: ["$total_current", 2] },
//         timestamp: {
//           $dateToString: {
//             format: "%Y-%m-%dT%H:%M:%S.%LZ",
//             date: "$created_at",
//           },
//         },
//       })
//       .toArray();

//     if (result.length === 0) {
//       return {
//         results: "No data available.",
//         status: "error",
//       };
//     }

//     return {
//       results: result, 
//       status: "success",
//     };
//   } catch (error) {
//     console.error("Error fetching data from MongoDB:", error);
//     throw error;
//   }
// }
export async function fetchRealTimeCurrentData(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 100 * 1000); 
  try {
    const collection = db.collection('cts');

    const result = await collection
      .find({
        created_at: { $gte: startTime, $lte: currentTime },
        mac: macAddress,
      })
      .sort({ created_at: -1 })
      .limit(1)
      .project({
        _id: 0,
        total_current: { $round: ["$total_current", 2] },
        timestamp: {
          $dateToString: {
            format: "%Y-%m-%dT%H:%M:%S.%LZ",
            date: "$created_at",
          },
        },
      })
      .toArray();

    if (result.length === 0) {
      return {
        results: "No data available.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error);
    throw error;
  }
}

export async function fetchMostRecentDataPoint(db, macAddress) {
  try {
    const collection = db.collection('cts');

    const result = await collection
      .find({ mac: macAddress })
      .sort({ created_at: -1 })
      .limit(25)
      .project({
        _id: 0,
        timestamp: 1,
      })
      .toArray();

    if (result.length === 0) {
      console.log("No data found in cts collection.");
      return {
        timestamp: null,
      };
    }

    return {
      timestamp: result[0].timestamp,
    };
  } catch (error) {
    console.error("Error fetching most recent data from MongoDB:", error);
    throw error;
  }
}


export async function fetchRealTimeAmbientData(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 100 * 1000); // 15 seconds ago
  try {
    const collection = db.collection('ambients');

    const result = await collection
      .find({
        mac: macAddress,
        created_at: { $gte: startTime, $lte: currentTime },
      })
      .sort({ created_at: -1 })
      .limit(25)
      .project({
        _id: 0,
        amb_temp: 1,
        ambient_humidity: 1,
        created_at: {
          $dateToString: {
            format: "%Y-%m-%dT%H:%M:%S.%LZ",
            date: "$created_at",
          },
        },
      })
      .toArray();

    if (result.length === 0) {
      return {
        results: "No ambient data available of this Node.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching ambient data from MongoDB:", error);
    throw error;
  }
}


export async function fetchRealTimeThermisterData(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 100 * 1000); // 15 seconds ago
  try {
    const collection = db.collection('thermisters');

    const result = await collection
      .find({
        mac: macAddress,
        created_at: { $gte: startTime, $lte: currentTime },
      })
      .sort({ created_at: -1 })
      .limit(25)
      .project({
        _id: 0,
        therm_temp: 1,
        created_at: {
          $dateToString: {
            format: "%Y-%m-%dT%H:%M:%S.%LZ",
            date: "$created_at",
          },
        },
      })
      .toArray();

    if (result.length === 0) {
      return {
        results: "No thermister data available of this Node.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching thermister data from MongoDB:", error);
    throw error;
  }
}


export async function fetchRealTimeVibrationData(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 100 * 1000); // 15 seconds ago

  try {
    const collection = db.collection('vibrations');

    const result = await collection
      .find({
        mac: macAddress,
        created_at: { $gte: startTime, $lte: currentTime },
      })
      .sort({ created_at: -1 })
      .limit(25)
      .project({
        _id: 0,
        vibration: 1,
        timestamp: {
          $dateToString: {
            format: "%Y-%m-%dT%H:%M:%S.%LZ",
            date: "$created_at",
          },
        },
      })
      .toArray();

    if (result.length === 0) {
      return {
        results: "No vibration data available for this Node.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching vibration data from MongoDB:", error);
    throw error;
  }
}

export async function fetchRealTimeCTData(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 100 * 1000); // 15 seconds ago
  try {
    const collection = db.collection('cts');

    const result = await collection
      .find({
        mac: macAddress,
        created_at: { $gte: startTime, $lte: currentTime },
      })
      .sort({ created_at: -1 })
      .limit(25)
      .project({
        _id: 0,
        CT1: 1,
        CT2: 1,
        CT3: 1,
        timestamp: {
          $dateToString: {
            format: "%Y-%m-%dT%H:%M:%S.%LZ",
            date: "$created_at",
          },
        },
      })
      .toArray();

    if (result.length === 0) {
      return {
        results: "No CT data available for this Node.",
        status: "error",
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching CT data from MongoDB:", error);
    throw error;
  }
}
