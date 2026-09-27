export default {
  fetchAndStore: async () => {
  	try {
			storeValue("connectedMachine", null);
			const connectedRaw = await apiGetConnectedMachines.run();
			const machinesRaw = await getAllMachines.run();

			const connected = Array.isArray(connectedRaw) ? connectedRaw : connectedRaw && typeof connectedRaw === "object" ? [connectedRaw] : [];
			const machines = Array.isArray(machinesRaw) ? machinesRaw : machinesRaw && typeof machinesRaw === "object" ? [machinesRaw] : [];
		
	    storeValue("connectedPcList", Array.isArray(connected) ? connected : []);
  	  storeValue("allMachinesList", Array.isArray(machines) ? machines : []);
		} catch (err) {
  	  // reset lists so UI doesn't show stale data
    	storeValue("connectedPcList", []);
	    storeValue("allMachinesList", []);
  	  storeValue("connectedMachine", null);
	  }
  },

	getConnectedTableList: () => {
  	const connected = appsmith.store.connectedPcList || [];
	  const machines = appsmith.store.allMachinesList || [];

  	return connected
    	.filter(reg => reg && typeof reg.machineId === "number")
	    .map(reg => {
  	    const match = machines.find(m => m.id === reg.machineId);

    	  const formatDate = (dateStr) => {
      	  return dateStr ? moment.parseZone(dateStr).tz(moment.tz.guess()).format("MMM DD, YYYY h:mm A") : "Unknown"; };

	      return {
  	      "Machine ID": reg.machineId,
    	    Connected: reg.connected ?? false,
      	  "Last Seen": formatDate(reg.lastSeen),
        	"Remote IP": reg.remoteIp ?? "Unknown",
	        "MSP ID": match?.msp_id ?? "Unlinked",
  	      "Site Id": match?.site_id ?? "Unlinked",
    	    "Version": match?.["Software Version"] ?? "Unknown",
      	  "- LAST BACKUP -": formatDate(match?.["- LAST BACKUP -"]),
        	Notes: match?.Notes ?? "Unknown",
	        Created: formatDate(match?.["Create Date"]),
  	      "Machine Name": match?.["PC Name"] ?? "Unknown",
    	    Type: match?.Type ?? "Unknown",
      	  Status: match?.Status ?? "Unknown",
        	"Activation Code": match?.["Activation Code"] ?? "Unknown"
	      };
  	  });
	},
};