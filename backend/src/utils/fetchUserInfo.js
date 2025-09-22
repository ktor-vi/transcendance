export function validateEmail(toTest)
{
	if (/^[^<>/]{3,20}$/.test(toTest))
		return (true);
	return (false);
}

export function validateString(toTest)
{
	if (/^[a-zA-Z0-9_]{3,20}$/.test(toTest))
		return (true);
	return (false);
}

// Fetch user info from Google API
export async function fetchUserInfo(accessToken) {
	const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	return res.json();
}
