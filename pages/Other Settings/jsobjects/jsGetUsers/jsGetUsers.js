export default {
  getUserData: () => {
    if (!apiGetMspEditors.data || !getMspSites.data) return [];
    const merged = apiGetMspEditors.data.users.map(u => {
      const site = getMspSites.data.find(s => s.id == u.site_id);
      const siteName = (u.role === "administrator" || u.role === "subscriber") ? "All" : (site ? site.site_name : "Unknown");
      return {
        user_id: u.id,
        email: u.email,
        role: u.role,
        site_id: u.site_id,
        msp_id: u.msp_id,
        site_name: siteName
      };
    });
    storeValue("usersWithSites", merged);
    return merged;
  },
}