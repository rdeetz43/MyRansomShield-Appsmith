export default {
  showMsps: async () => {
		btnCreateSite.setVisibility(false);
		btnDeleteSite.setVisibility(false);
			
		await jsTableHelpers.setButtonColor(appsmith.store.currentTable);
		btnAdminGetMsps.setColor("#00A82F");
    const table = "msps";
		storeValue("currentTable", table);
    await getMsps.run();
		const rawMsps = getMsps.data;

		if (!rawMsps || rawMsps.length === 0) {
    	await storeValue("activeData", []); // Clear the table
    	return [];
  	}

		const fieldsToFormat = jsTableHelpers.fieldMap[table];
    const formattedMsps = jsTableHelpers.formatRows(rawMsps, fieldsToFormat);
    const orderedMsps = await jsTableHelpers.applyColumnOrder(table, formattedMsps);
    await storeValue("activeData", orderedMsps);
    return orderedMsps;
  },
	
  showSites: async () => {
		btnCreateSite.setVisibility(true);
		btnDeleteSite.setVisibility(true);
			
		await jsTableHelpers.setButtonColor(appsmith.store.currentTable);
		btnSites.setColor("#00A82F");
    const table = "sites";
		
		// For admin users change the current MSP based on row selection
		if (appsmith.store.isAdmin) {
			if (appsmith.store.currentTable == "msps") {
		 		storeValue("currentMsp", tableMain.selectedRow.id);
	    	await getMspName.run();
			}
		}
		
		storeValue("currentTable", table);
    await getSites.run();
		const rawSites = getSites.data;

		if (!rawSites || rawSites.length === 0) {
    	await storeValue("activeData", []); // Clear the table
    	return [];
  	}

		const fieldsToFormat = jsTableHelpers.fieldMap[table];
    const formattedSites = jsTableHelpers.formatRows(rawSites, fieldsToFormat);
    const orderedSites = await jsTableHelpers.applyColumnOrder(table, formattedSites);
    await storeValue("activeData", orderedSites);
    return orderedSites;
  },
	
	showMachines: async (asAdmin) => {
		btnCreateSite.setVisibility(false);
		btnDeleteSite.setVisibility(false);

		await jsTableHelpers.setButtonColor(appsmith.store.currentTable);
		const table = "machines";
		await storeValue("currentTable", table);

		// Reset selected machine
		await storeValue("connectedMachine", null);

		// --- Helper: normalize API responses safely ---
		const normalize = (raw) => {
			if (!raw) return [];
			if (Array.isArray(raw)) return raw;
			if (Array.isArray(raw.data)) return raw.data;
			if (typeof raw === "object") return [raw];
			return [];
		};

		// --- Fetch all machines based on role ---
		let allRaw;

		if (asAdmin && appsmith.store.isAdmin) {
			await getAllMachines.run();
			allRaw = getAllMachines.data;
			btnAllMachines.setColor("#00A82F");
		} else if (appsmith.store.isAdminOrSubscriber) {
			await getMspMachines.run();
			allRaw = getMspMachines.data;
			btnMachines.setColor("#00A82F");
		} else if (appsmith.store.isEditor) {
			await getSiteMachineList.run();
			allRaw = getSiteMachineList.data;
		}

		const allMachines = normalize(allRaw);

		// Store raw machines immediately (pre-enrichment)
		await storeValue("activeData", allMachines);

		// --- Fetch connected machines ---
		try { await apiGetConnectedMachines.run(); } catch (e) {}
		const conMachines = normalize(apiGetConnectedMachines.data);

		// --- Enrich machines with "Up" status ---
		const enrichedMachines = allMachines.map(machine => {
			const match = conMachines.find(c => c.machineId === machine.id);
			return {
				...machine,
				Up: match ? match.connected === true : false
			};
		});

		// --- Format + order columns ---
		const fieldsToFormat = jsTableHelpers.fieldMap[table];
		const formatted = jsTableHelpers.formatRows(enrichedMachines, fieldsToFormat);
		const ordered = await jsTableHelpers.applyColumnOrder(table, formatted);

		// --- Store final table data ---
		await storeValue("activeData", ordered);

		return ordered;
	}
}