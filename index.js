'use strict';

const twintentUrl = 'https://twitter.com/intent/tweet';

async function
main()
{
	const tabs = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});
	const tab = tabs[0];

	const url = new URL(twintentUrl);
	const params = url.searchParams;
	params.set('text', tab.title);
	params.set('url', tab.url);

	location.href = url.toString();
}

main();
