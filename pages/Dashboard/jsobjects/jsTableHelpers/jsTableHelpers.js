export default {
	// Validate avatar file types
	validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
  },

	formatDate: (dateStr, includeTime = false) => {
  	if (!dateStr || typeof dateStr !== "string") return "";

  	if (!includeTime)
			return moment.parseZone(dateStr).tz(moment.tz.guess()).format("MMM DD, YYYY");

		return moment.parseZone(dateStr).tz(moment.tz.guess()).format("MMM DD, YYYY h:mm A");
	},

	formatRows: (rows, fields = ["created_at", "birthdate"]) => {
	  return rows.map(row => {
	    const formatted = { ...row };

			fields.forEach(field => {
  			const raw = row[field];
  			if (!raw || typeof raw !== "string") return;

	  		const includeTime = raw.length > 10;

  			try {
  			  formatted[field] = jsTableHelpers.formatDate(raw, includeTime);
  			} catch (e) {
  		  	formatted[field] = raw;
 	 			}
			});
    	return formatted;
  	});
	},

	// Config map for which fields to format per table
  fieldMap: {
    msps: ["Onboarding Date"],
    sites: ["Create Date"],
    machines: ["Last Backup", "Create Date"]
  },

	columnOrderMap: {
    msps: ["MSP Name", "Contact Name", "Email", "Phone", "Address", "Onboarding Date", "Latest Version", "Update Path", "Notes", "Status", "MSP ID", "id"],
    sites: ["Site Name", "Address", "Contact Name", "Email", "Phone", "Site Key", "Notes", "Create Date", "id"],
    machines: ["PC Name", "Up", "Site Name", "Last Backup", "Type", "Software Version", "Latest Version", "Software Status", "Create Date", "Notes", "Machine Key", "id"]
  },

  applyColumnOrder: async (tableName, data) => {
    const order = jsTableHelpers.columnOrderMap[tableName];
    if (!order || !Array.isArray(data)) return;

    const reordered = data.map(row => {
      const newRow = {};
      order.forEach(key => {
        newRow[key] = row[key] ?? ""; // Fill missing keys safely
      });
      return newRow;
    });

    return reordered;
  },

	setButtonColor: async (currentTable) => {
		  switch (currentTable) {
    		case "msps":
					btnAdminGetMsps.setColor("#00721E");
					return;
    		case "sites":
					btnSites.setColor("#00721E");
					return;
    		case "machines":
					btnAllMachines.setColor("#00721E");
					btnMachines.setColor("#00721E");
					return;
			}
	},

	formatBytes: (bytes) => {
  	if (!bytes || isNaN(bytes)) {
    	return '';
	  }

	  const TB = 1099511627776; // 1024^4
  	const GB = 1073741824;    // 1024^3
	  const MB = 1048576;       // 1024^2
  	const KB = 1024;          // 1024^1

	  if (bytes >= TB) {
  	  return (bytes / TB).toFixed(2) + ' TB';
	  } else if (bytes >= GB) {
  	  return (bytes / GB).toFixed(1) + ' GB';
	  } else if (bytes >= MB) {
  	  return (bytes / MB).toFixed(1) + ' MB';
	  } else if (bytes >= KB) {
  	  return (bytes / KB).toFixed(1) + ' KB';
	  } else {
  	  return bytes + ' B'; // optional: show raw bytes instead of empty string
	  }
	},

	formatDualBytes: (bytes) => {
		if (bytes === "") return "";
		if (bytes === 0) return "0";
  	const formattedNumber = Number(bytes).toLocaleString("en-US");
  	const humanReadable = jsTableHelpers.formatBytes(bytes);
  	return humanReadable === '' ? `${formattedNumber}` : `${humanReadable} (${formattedNumber})`;
	},
	
	formatElapsedTime: (startDate, endDate) => {
	  const start = new Date(startDate);
  	const end = new Date(endDate);
	  const diffSeconds = Math.floor((end - start) / 1000);
	  if (diffSeconds < 60) {
  	  // under 1 minute → show seconds
    	return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''}`;
	  }
  	if (diffSeconds < 3600) {
	    // under 60 minutes → show minutes + seconds
  	  const minutes = Math.floor(diffSeconds / 60);
    	const seconds = diffSeconds % 60;
	    if (seconds === 0) {
  	    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    	}
	    return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
  	}
	  // otherwise → show hours + minutes
  	const hours = Math.floor(diffSeconds / 3600);
  	const minutes = Math.floor((diffSeconds % 3600) / 60);
	  if (minutes === 0) {
  	  return `${hours} hour${hours !== 1 ? 's' : ''}`;
	  }
  	return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
	}
}

