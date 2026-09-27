export default {
	async seleteSite () {
    const selectedRow = tableMain.selectedRow; // your table widget
    const siteId = selectedRow.id;              // or selectedRow.site_key
    await deleteSite.run({ siteId });
		await jsOpenTable.showSites();
    showAlert("Site removed successfully", "success");
	}
}