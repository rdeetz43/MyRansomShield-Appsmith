export default {
	async sendInfo () {
		if (!inpReminderText.text || inpReminderText.text.trim().length < 10) {
			showAlert("Reminder message must be at least 10 characters long.", "error");
		}
		else {
			await apiSendReminderInfo.run();
			showAlert("Reminder info set successfully!", "success");
		}
	},
	
	async sendSiteUserInfo(row) {
    await apiSaveEditorSite.run({
      user_id: row.user_id,
      site_id: row.site_name
    });
    return true;
  }
}