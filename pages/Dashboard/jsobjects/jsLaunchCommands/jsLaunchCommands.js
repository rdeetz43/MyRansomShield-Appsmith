export default {
  // --- Notification flow ---
  async sendNotification() {
    storeValue("msgTitle", inpMsgTitle.text);
    storeValue("msgText", inpMsgText.text);
    await apiMachineNotification.run();
    await closeModal(modalSendMessage.name);
    jsOpenModal.openEditModal();
  },

	// --- Collect logs flow ---
  logPollHandle: null,

  async sendCollectLogs() {
		await apiResetLogUploadStatus.run();
    await apiMachineCollectLogs.run();
    this.startLogPolling();
  },
	
	startLogPolling() {
    clearInterval(this.logPollHandle);
    this.logPollHandle = null;
	
		this.logPollHandle = setInterval(async () => {
			try {
			  await apiGetLogUploadStatus.run();
			  if (apiGetLogUploadStatus.data.logupload_completed === true) {
			    clearInterval(this.logPollHandle);
			    this.logPollHandle = null;
					if (apiGetLogUploadStatus.data.download_url != null)
					{
						btnDownloadLogs.setColor("#1d4ed8");
		  	    storeValue("logUrl", apiGetLogUploadStatus.data.download_url);
	        	showAlert("Log upload completed.", "info");
					}
					else
	        	showAlert("Log upload completed, no URL", "info");
			    await apiResetLogUploadStatus.run();
			  }
			} catch (e) {
	 	  	  showAlert(`Error checking log upload status: ${e.message}`, "error");
	        clearInterval(this.logPollHandle);
  	      this.logPollHandle = null;
			}
		}, 5000);
	},
	
	async downloadLogs () {
		if (appsmith.store.logUrl && appsmith.store.logUrl !== "") {
	    navigateTo(appsmith.store.logUrl, {}, "NEW_WINDOW");
  	  btnDownloadLogs.setColor("#a9a9ad");
		}
  },

	// --- Device refresh flow ---
  devicePollHandle: null,

  async sendDeviceRefresh() {
    await apiResetDeviceReloadStatus.run();
    await apiMachineRefreshDevices.run();
    this.startDevicePolling();
  },

	startDevicePolling() {
    clearInterval(this.devicePollHandle);
    this.devicePollHandle = null;
	
		this.devicePollHandle = setInterval(async () => {
			try {
			  await apiGetDeviceReloadStatus.run();
			  if (apiGetDeviceReloadStatus.data.devicerefresh_completed === true) {
			    clearInterval(this.devicePollHandle);
			    this.devicePollHandle = null;
			    await this.reloadDeviceList();
			    showAlert("Device reload completed", "info");
			    await apiResetDeviceReloadStatus.run();
			  }
			} catch (e) {
 	  	  showAlert(`Error checking device refresh status: ${e.message}`, "error");
      	clearInterval(this.devicePollHandle);
	      this.devicePollHandle = null;
			}
		}, 5000);
	},
	
	async reloadDeviceList() {
  	try {
    	await getMachineDevices.run();
	    const raw = getMachineDevices.data;

  	  if (Array.isArray(raw) && raw.length > 0) {
    	  const transformed = raw.map(d => ({
      	  ...d,
					Encryption: d.Encryption == "NotChecked" ? "" : d.Encryption,
        	"Used Space": jsTableHelpers.formatBytes(d.usedspace * d.bytespersector)
	      }));
  	    storeValue("editDevices", transformed);
    	} else {
	      storeValue("editDevices", []); // clear if empty
  	  }
	  } catch (e) {
  	  storeValue("editDevices", []); // clear on error
  	}
	},
	
	// --- Clean PC flow ---
  cleanPollHandle: null,

  async getCleanupPaths() {
		storeValue("showEnable", true);
		btnLaunchCleanup.setDisabled(true);
   	await apiResetCleanPcStatus.run();
    await apiMachineCleanupPaths.run();
    this.startCleanPolling();
  },

  async openCleanupCalendar() {
		resetWidget("dateTimer");
		await showModal(modalCalendarCleanup.name);
  },
	
	async sendCleanPc(useDate) {
    const editReports = appsmith.store.editReports;
    const enabledPaths = editReports.filter(item => item.enable === true).map(item => item.target);
    storeValue("cleanedTargets", enabledPaths);

		storeValue("timerDate", useDate && dateBackup.selectedDate ? moment(dateCleanup.selectedDate).format("YYYY-MM-DD HH:mm") : "");
		await apiMachineCleanup.run();
    closeModal(modalCalendarCleanup.name);
  },
	
	startCleanPolling() {
    clearInterval(this.cleanPollHandle);
    this.cleanPollHandle = null;
	
		this.cleanPollHandle = setInterval(async () => {
  	  try {
    	  await apiGetCleanPcStatus.run();
      	if (apiGetCleanPcStatus.data.cleanuppc_completed === true) {
	        clearInterval(this.cleanPollHandle);
  	      this.cleanPollHandle = null;

					const cleaned = (apiGetCleanPcStatus.data.cleaned_targets || []).map((t, i) => ({
							target: t,
							size: jsTableHelpers.formatDualBytes(apiGetCleanPcStatus.data.size_targets?.[i] ?? 0),
							status: "pending",
							enable: true
					}));

					const failed = (apiGetCleanPcStatus.data.failed_targets || []).map(t => ({
							target: t,
							size: null,   // or 0, or "N/A"
							status: "failed",
							enable: false
					}));

					const unified = [...cleaned, ...failed];
					storeValue("editReports", unified);
				
					jsLaunchCommands.displayCleanup();

					await apiResetCleanPcStatus.run();
      	  showAlert("Clean PC launch completed", "info");
	      }
  	  } catch (e) {
 	  	  showAlert(`Error checking clean PC status: ${e.message}`, "error");
      	clearInterval(this.cleanPollHandle);
	      this.cleanPollHandle = null;
  	  }
	  }, 5000);
	},
	
  async toggleReportView() {
		if (btnViewReports.text === "Report View") {
			storeValue("showEnable", false);
			storeValue("cleanupList", appsmith.store.editReports);
			txtMachineReportTitle.setText("Backup Reports");
			btnLaunchRemoteCleanup.setVisibility(false);
			btnViewReports.setLabel("Cleanup View");
			storeValue("editReports", appsmith.store.saveReports);
		}
		else {
			storeValue("showEnable", true);
			txtMachineReportTitle.setText("Cleanup Folders");
			btnViewReports.setLabel("Report View");
			btnViewReports.setVisibility(true);
			btnLaunchRemoteCleanup.setVisibility(true);
			storeValue("editReports", appsmith.store.cleanupList);
		}
  },

  async displayCleanup() {
		txtMachineReportTitle.setText("Cleanup Folders");
		btnViewReports.setLabel("Report View");
		btnViewReports.setVisibility(true);
		btnLaunchRemoteCleanup.setVisibility(true);
	},
	
  async updateDisable() {
	  const reports = appsmith.store.editReports;   // your current array
  	const updated = [...reports];                 // copy it

	  tableMachineReports.updatedRows.forEach(r => {
  	  const idx = r.index;

    	// Merge updatedFields into the existing row
	    updated[idx] = {
  	    ...reports[idx],           // original row
    	  ...r.updatedFields,        // only the fields that changed
      	status: r.updatedFields.enable ? "pending" : "disabled"
	    };
  	});

  	await storeValue("editReports", updated);
	},
	
	// --- Update software flow ---
  updatePollHandle: null,

  async openUpdateCalendar() {
		resetWidget("dateTimer");
		await showModal(modalCalendarUpdate.name);
  },

  async sendUpdateSoftware(useDate) {
		storeValue("timerDate", useDate && dateBackup.selectedDate ? moment(dateUpdater.selectedDate).format("YYYY-MM-DD HH:mm") : "");
   	await apiResetSoftwareUpdateStatus.run();
    await apiMachineSoftwareUpdate.run();
    this.startUpdatePolling();
    closeModal(modalCalendarUpdate.name);
  },

	startUpdatePolling() {
    clearInterval(this.updatePollHandle);
    this.updatePollHandle = null;
	
		this.updatePollHandle = setInterval(async () => {
  	  try {
    	  await apiGetSoftwareUpdateStatus.run();
      	if (apiGetSoftwareUpdateStatus.data.softwareupdate_completed === true) {
	        clearInterval(this.updatePollHandle);
  	      this.updatePollHandle = null;
					
					const newVersion = appsmith.store.editRow["Latest Version"];
					await storeValue("softwareVersion", newVersion);
					await updateSoftwareVersion.run();
			  	btnMachineUpdateAgent.setDisabled(true);

					//const updatedData = appsmith.store.activeData[tableMain.triggeredRowIndex]["Software Version"] = newVersion; // update the column

					const updatedData = (appsmith.store.activeData || []).map((row, index) => {
						if (index === tableMain.triggeredRowIndex) {
							return {
								...row,
								"Software Version": newVersion   // update just this column
							};
						}
						return row;
					});

					storeValue("activeData", updatedData);
					storeValue("editRow", {
					  ...appsmith.store.editRow,
					  "Software Version": newVersion
					});

      	  showAlert("Software update completed", "info");
        	await apiResetSoftwareUpdateStatus.run();
	      }
  	  } catch (e) {
 	  	  showAlert(`Error checking software update status: ${e.message}`, "error");
      	clearInterval(this.updatePollHandle);
	      this.updatePollHandle = null;
  	  }
	  }, 5000);
	},

	// --- Backup flow ---
  backupPollHandle: null,

	async openBackupCalendar() {
		resetWidget("dateTimer");
		await showModal(modalCalendarBackup.name);
  },
	
	async sendBackup(useDate) {
		storeValue("timerDate", useDate && dateBackup.selectedDate ? moment(dateBackup.selectedDate).format("YYYY-MM-DD HH:mm") : moment().add(2, "minutes").format("YYYY-MM-DD HH:mm"));
   	await apiResetBackupStatus.run();
    this.startBackupPolling();
    await apiMachineBackup.run();
    closeModal(modalCalendarBackup.name);
  },

	startBackupPolling() {
    clearInterval(this.backupPollHandle);
    this.backupPollHandle = null;
	
		this.backupPollHandle = setInterval(async () => {
			try {
			  await apiGetBackupStatus.run();
			  if (apiGetBackupStatus.data.backuplaunch_completed === true) {
			    clearInterval(this.backupPollHandle);
			    this.backupPollHandle = null;
			    showAlert("Backup launch completed", "info");
			    await apiResetBackupStatus.run();
			  }
			} catch (e) {
 	  	  showAlert(`Error checking backup launch status: ${e.message}`, "error");
      	clearInterval(this.backupPollHandle);
	      this.backupPollHandle = null;
			}
		}, 5000);
	},
};
