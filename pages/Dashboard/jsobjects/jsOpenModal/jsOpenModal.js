export default {

	createSite: async () => {
   	await storeValue("editRow", []);
   	await storeValue("editMachines", []);
   	await storeValue("selectedMachines", []);
   	await storeValue("isCreateSite", true);
		resetWidget("inpSiteName");
		resetWidget("inpSiteContactName");
		resetWidget("inpSiteEmail");
		resetWidget("inpSiteName");
		resetWidget("inpSiteNotes");
		resetWidget("inpSiteAddress");
		resetWidget("inpSitePhone");
		resetWidget("msUpdateSiteMachines");
		txtSiteTitle.setText("Create New Site")
		showModal(modalEditSite.name);
	},

  updateSiteMachines: async () => {
    const selectedMachines = msUpdateSiteMachines.selectedOptionValues; // current selection
    const currentData = tableSiteMachines.tableData || [];

    // Step 1: Remove rows not in the current selection
    const filteredData = currentData.filter(row =>
      selectedMachines.includes(row.id) // keep only still-selected
    );

    // Step 2: Fetch any newly selected machines not already in the table
    const existingIds = filteredData.map(row => row.id);
    const newIds = selectedMachines.filter(id => !existingIds.includes(id));

    const newRows = await Promise.all(
      newIds.map(id => getSiteMachine.run({ machineId: id }))
    );

    // Step 3: Flatten and merge
    const combined = [...filteredData, ...newRows.flat()];

    // Step 4: Deduplicate by id (in case of overlap)
    const deduped = [
      ...new Map(combined.map(row => [row.id, row])).values()
    ];

    await storeValue("editMachines", deduped);
	},
	
  prepopulateSiteMachines: async (siteId) => {
    // Fetch all machines assigned to this site
    const assigned = await getSiteMachinesDropdown.run({ siteId });

    // Extract just the IDs for MultiSelect
    const assignedIds = assigned.map(row => row.id);

    // Store them so the MultiSelect can use them
    await storeValue("editMachines", assigned); // for table
    await storeValue("selectedMachines", assignedIds); // for MultiSelect

    // Bind MultiSelect defaultSelectedValues to appsmith.store.selectedMachines
    // Bind tableSiteMachines.tableData to appsmith.store.editMachines
  },

	openEditModal: async () => {
   	await storeValue("isCreateSite", false);
    const table = appsmith.store.currentTable;
    const modalMap = {
      msps: "modalEditMsp",
      sites: "modalEditSite",
      machines: "modalEditMachine"
		};
		
    const row = tableMain.triggeredRow;
		
		// Fetch report info for current machine
    if (table === "machines") {
			// Set UI state for selected machine
			storeValue("connectedMachine", row["Machine Key"]);
			txtMachineReportTitle.setText("Backup Reports");
			btnViewReports.setVisibility(false);
			btnLaunchCleanup.setDisabled(false);
			btnLaunchRemoteCleanup.setVisibility(false);
			storeValue("showEnable", false);

			// Fetch MSP machines
			if (!appsmith.store.isAdmin && getMspMachines.data == null) {
				getMspMachines.run();
			}
				
			const mspRaw = appsmith.store.isAdmin ? getAllMachines.data : getMspMachines.data;
			const mspMatch = mspRaw.find(m => String(m.id) === String(row.id));

			// Fetch connected machines
			let connectedList = [];
			try {
			  await apiGetConnectedMachines.run();
			  connectedList = Array.isArray(apiGetConnectedMachines.data) ? apiGetConnectedMachines.data : apiGetConnectedMachines.data && typeof apiGetConnectedMachines.data === "object" ? [apiGetConnectedMachines.data] : [];
			} catch (e) {
			  console.log("apiGetConnectedMachines failed:", e);
			}
			const conMatch = connectedList.find(c => String(c.machineId) === String(row.id));
			const fullRow = {
			  ...row,
			  activation_code: mspMatch?.["Activation Code"] ?? null,
			  machine_notes: mspMatch?.Notes ?? null,
			  install_id: mspMatch?.install_id ?? null,
			  connected: conMatch?.connected === true ? "Running" : "Unavailable"
			};
			storeValue("editRow", fullRow);
			
			await getReports.run({ id: row.id })
			  .then(() => {
			    const raw = getReports.data;
			    if (Array.isArray(raw) && raw.length > 0) {
      			const transformed = raw.map(r => ({
			        ...r,
      			  "Start Time": jsTableHelpers.formatDate(r["Start Time"], true),
      			  "End Time": jsTableHelpers.formatDate(r["End Time"], true),
      			  "Elapsed Time": jsTableHelpers.formatElapsedTime(r["Start Time"], r["End Time"]),
			        "Byte Total": jsTableHelpers.formatDualBytes(r["Byte Total"]),
      			  "File Total": r["File Total"].toLocaleString("en-US"),
			        "Folder Total": r["Folder Total"].toLocaleString("en-US"),
							enable: false
      			}));

			      // Find the last backup by Start Time
      			const lastBackup = transformed.reduce((latest, current) => {
			        const currentStart = new Date(current["Start Time"]);
      			  const latestStart = latest ? new Date(latest["Start Time"]) : new Date(0);
			        return currentStart > latestStart ? current : latest;
      			}, null);

			      storeValue("editReports", transformed);
				    storeValue("saveReports", transformed);
      			storeValue("lastBackup", lastBackup["Start Time"]);
			    } else {
			      storeValue("editReports", []);
      			storeValue("lastBackup", null);
			    }
			  })
		  .catch(() => {
		    showAlert("Failed to get machine reports", "error");
		  });
			
			await storeValue("editDevices", undefined);
			await getMachineDevices.run()
  			.then(() => {
		    	const raw = getMachineDevices.data;
	    		if (Array.isArray(raw) && raw.length > 0) {
			      const transformed = raw.map(d => ({
    			    ...d,
							Encryption: d.Encryption == "NotChecked" ? "" : d.Encryption,
      	  		"Used Space": jsTableHelpers.formatBytes(d.usedspace * d.bytespersector),
		    	  }));
    		  	storeValue("editDevices", transformed);
			    } else {
			      storeValue("editDevices", []); // optional: clear previous state
    			}
		 		})
				.catch(() => {
			      storeValue("editDevices", []); // optional: clear previous state
	  		});
				
			storeValue("currentMachine", row.id);

			if (appsmith.store.editRow["Software Version"] === appsmith.store.editRow["Latest Version"]) {
				storeValue("softwareVersion", appsmith.store.editRow["Software Version"]);
			  btnMachineUpdateAgent.setDisabled(true);
			} else {
				storeValue("softwareVersion", appsmith.store.editRow["Software Version"] + "  Latest: " + appsmith.store.editRow["Latest Version"]);
			  btnMachineUpdateAgent.setDisabled(false);
			}
    } 

		// Fetch report info for current machine
    else if (table === "sites") {
			// Get all connected machines
			try { await apiGetConnectedMachines.run(); } catch(e) {}
		
			let enrichedMachines;
 			let conRaw;
 			let allRaw;
		
			await jsOpenModal.prepopulateSiteMachines(tableMain.triggeredRow.id);
		  await getMspMachines.run();
		  await getSiteMachines.run();
  		allRaw = getSiteMachines.data;
  	
			await apiGetConnectedMachines.run();
	  	conRaw = apiGetConnectedMachines.data || [];

  		const conMachines = Array.isArray(conRaw) ? conRaw : conRaw && typeof conRaw === "object" ? [conRaw] : [];
  		const siteMachines = Array.isArray(allRaw) ? allRaw : allRaw && typeof allRaw === "object" ? [allRaw] : [];

			enrichedMachines = siteMachines.map(machine => {
			const match = conMachines.find(c => c.machineId === machine.id);
    		return {
					...machine,
	      	"Up": match ? match.connected === true ? true : false : false
  	  	};
  		});
			await storeValue("editMachines", enrichedMachines);
			//showAlert("TEST", "success");
	
			if (!enrichedMachines || enrichedMachines.length === 0) {
    		await storeValue("editMachines", []); // Clear the table
    		//return [];
	  	}
			
    	storeValue("currentSite", tableMain.triggeredRow.id);
	   	storeValue("editRow", row);
    } 

		else if (table === "msps") {
	   	storeValue("editRow", row);
		}

		showModal(modalMap[table]);
	},
	
	formatElapsedTime: async (start, end) => {
		if (!start || !end) return "";

		const startDate = new Date(start);
		const endDate = new Date(end);

		if (isNaN(startDate) || isNaN(endDate)) return "";

		let diff = endDate - startDate; // milliseconds

		const seconds = Math.floor(diff / 1000) % 60;
		const minutes = Math.floor(diff / (1000 * 60)) % 60;
		const hours = Math.floor(diff / (1000 * 60 * 60));

		return `${hours}h ${minutes}m ${seconds}s`;
	}
}
