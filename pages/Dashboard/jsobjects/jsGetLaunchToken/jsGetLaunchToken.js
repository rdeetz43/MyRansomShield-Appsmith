export default {
  getTokenFromURL: async () => {
    const token = appsmith.URL.queryParams.token;
    const lastToken = appsmith.store.lastToken;

    // CASE 1: Launch button with a new token
    if (token && token !== lastToken) {
      await storeValue("lastToken", token);
      await storeValue("jwt", token);

      const response = jsGetLaunchToken.decodeJWT(token);
      if (!response) {
        showAlert("Invalid login token", "error");
        return;
      }

			await jsAuthUtils.setRoleFlags();
      await storeValue("user_email", response.user.email);
      await storeValue("roles", response.user.roles);
      await storeValue("custom", response.user.custom);

			const current_msp = await getLoggedInMspId.run();
			await storeValue("currentMsp", current_msp[0].id);

			showAlert(`Welcome, ${response.user.custom.company_name}`, "success");

      await jsOpenTable.showMachines(appsmith.store.isAdmin);
      return;
    }

    // CASE 2: Launch button but token already processed
/*    if (token && token === lastToken) {
      await jsOpenTable.showMachines();
      return;
    }

    // CASE 3: Login page mode (no token)
    const current_msp = await getLoggedInMspId.run();
    await storeValue("currentMsp", current_msp[0].id);
    await jsOpenTable.showMachines();*/
  },

	decodeJWT: (token) => {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return {
				user: {
					email: payload.email,
					roles: payload.roles,
					custom: payload.custom
				}
			};
		} catch (e) {
			showAlert("Invalid token", "error");
			return null;
		}
	}
}
