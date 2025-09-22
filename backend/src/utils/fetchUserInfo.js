// Fetch user info from Google API
export async function fetchUserInfo(accessToken) {
	const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	return res.json();
}
