export default {
	// 🔍 Check if token is expiring soon (default: within 2 minutes)
  isTokenExpiringSoon: (bufferSeconds = 120) => {
    const token = appsmith.store.jwt;
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return !payload.exp || payload.exp < (now + bufferSeconds);
    } catch (e) {
      return true; // fallback if token is malformed
    }
  },

  // 🔄 Refresh token if needed, else redirect to Login
  refreshIfNeeded: async () => {
    if (jsAuthUtils.isTokenExpiringSoon()) {
      try {
        const response = await refreshToken.run();
        storeValue("jwt", response.token);
        showAlert("Session refreshed", "info");
      } catch (error) {
        showAlert("Token refresh failed, please login again.", "error");
        navigateTo("Login");
      }
    }
  },

  // 🛡️ Set role flags for conditional UI logic
  setRoleFlags: () => {
		const roles = appsmith.store.roles || [];
		const isEditor = roles.includes("editor");
		const isSubscriber = roles.includes("subscriber");
		const isAdmin = roles.includes("administrator");

		storeValue("isEditor", isEditor);
		storeValue("isSubscriber", isSubscriber);
		storeValue("isAdmin", isAdmin);
		storeValue("isAdminOrSubscriber", isAdmin || isSubscriber);
		storeValue("isAdminOrSubscriberOrEditor", isAdmin || isEditor || isSubscriber);
  },

  // 🚀 Entry point for Dashboard onPageLoad
  initDashboard: async () => {
    //await jsAuthUtils.refreshIfNeeded();
  }
}