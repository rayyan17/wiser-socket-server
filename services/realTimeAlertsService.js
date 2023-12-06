import { ObjectId } from "mongodb";

export async function fetchMachinesCurrentState(db, labId) {
  const machinesCursor = db.collection("machines").find({ labId: new ObjectId(labId) });

  const machines = await machinesCursor.toArray();
  const results = [];

  for (const machine of machines) {
    let state = null;

    if (machine.nodeId) {
      try {
        const node = await db.collection("nodes").findOne({ _id: machine.nodeId });
        const macAddress = node.mac;
        
        // Update the query to filter by state directly
        const ct = await db
          .collection("cts")
          .findOne({ mac: macAddress, state: { $in: ["OFF", "IDLE"] } }, { state: 1, _id: 0 });

        if (ct) {
          state = ct.state;
        }
      } catch (error) {
        console.error("Error querying node or cts collection:", error);
      }
      const machineData = {
        machine: machine,
        state: state,
      };

      results.push(machineData);
    }
  }

  return results;
}
