export default {
	getLogin: async () => {
    const response = await getLoginTokenApi.run();

    // ✅ Store JWT and user metadata
    await storeValue("user_email", response.user_email);
    await storeValue("roles", response.roles);
    await storeValue("custom", response.custom);
		await storeValue("jwt", response.token);
		//storeValue("currentMsp", response.custom.msp_id);
		await storeValue("currentSite", response.custom.site_id);
		const current_msp = await getLoggedInMspId.run();
  	await storeValue("currentMsp", current_msp[0].id);
	
		// ✅ Get user roles
	  const isEditor = response.roles[0] === "editor";
	  const isSubscriber = response.roles[0] === "subscriber";
  	const isAdmin = response.roles[0] === "administrator";
	  await storeValue("isEditor", isEditor);
	  await storeValue("isSubscriber", isSubscriber);
  	await storeValue("isAdmin", isAdmin);
	  await storeValue("isAdminOrSubscriber", isAdmin || isSubscriber);
	  await storeValue("isAdminOrSubscriberOrEditor", isAdmin || isEditor || isSubscriber);
		
    // ✅ Navigate to dashboard
    navigateTo("Dashboard");

    // ✅ Optional: show welcome toast
		showAlert(`Welcome, ${response.custom.company_name}`, "success");
	}
}