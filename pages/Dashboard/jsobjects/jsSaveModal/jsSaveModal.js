export default {
updateAndRefresh: async () => {
  const table = appsmith.store.currentTable;

	// Map table names to update queries
  const updateMap = {
    msps: updateMsp,
    sites: updateSite,
    machines: updateMachine
  };

  // Map table names to reload the table after the modal closes
  const reloadMap = {
    msps: jsOpenTable.showMsps,
    sites: jsOpenTable.showSites,
    machines: jsOpenTable.showMachines
  };

  // Map table names to close the modal
  const modalMap = {
    msps: modalEditMsp.name,
    sites: modalEditSite.name,
    machines: modalEditMachine.name
  };

  try {
    const updateFn = updateMap[table];
    const reloadFn = reloadMap[table];
    const modalName = modalMap[table];

    //if (!createFn || !updateFn || !reloadFn) {
    if (!updateFn || !reloadFn) {
      showAlert(`No create, update, or reload function defined for table: ${table}`, "error");
      return;
    }

		if (table == "sites") {
			let newSiteId = tableMain.triggeredRow?.id ?? null;
			if (table == "sites" && appsmith.store.isCreateSite) {
				const siteResult = await createNewSite.run();
				newSiteId = siteResult[0].id;
			}
	    const selectedMachines = msUpdateSiteMachines.selectedOptionValues;
  	  await Promise.all(
     		selectedMachines.map(machineId =>
   	  	  updateMachineSite.run({ siteId: newSiteId, machineId })
  	    )
	    );

			if (appsmith.store.isCreateSite) await showAlert("New site created", "success");
	    await closeModal(modalName);
			await jsOpenTable.showSites();
      return;
		}

		await updateFn.run();
    await reloadFn();
    closeModal(modalName);
  } catch (err) {
    showAlert("Update failed. Check logs or rollback.", "error");
  }
}}