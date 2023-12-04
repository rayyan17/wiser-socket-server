export default async function fetchRealTimeCurrentData(db, macAddress) {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - 60 * 1000); // 15 seconds ago
  try {
    const collection = db.collection('cts'); // Change the collection name to 'cts'

    const result = await collection
      .aggregate([
        {
          $match: { created_at: { $gte: startTime, $lte: currentTime } },
          mac: macAddress
        },
        {
          $project: {
            _id: 0,
            average_current: { $round: ["$CT_Avg", 2] },
            total_current: { $round: ["$total_current", 2] },
            timestamp: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S.%LZ",
                date: "$created_at",
              },
            },
          },
        },
        {
          $limit: 1,
        },
      ])
      .toArray();

    if (result.length === 0) {
      console.log("No data found for the last 15 seconds.");
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
