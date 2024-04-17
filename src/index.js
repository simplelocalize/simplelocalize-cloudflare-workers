// import parser from 'accept-language-parser';

const DEBUG = false;
const DEFAULT_LANGUAGE = "en";
const PROJECT_TOKEN = "b2ef221716b147648a963b8067c2a53b";
const ENVIRONMENT = "_latest";
const BASE_URL = "https://simplelocalize.github.io/simplelocalize-cloudflare-workers";

addEventListener('fetch', event => {
	event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
	const url = new URL(event.request.url);
	const pathname = url.pathname;
	const fetchOptions = {
		cacheControl: {
			bypassCache: DEBUG,
		},
	};

	try {
		const languageKey = url.searchParams.get('lang') ?? DEFAULT_LANGUAGE;
		const translations = await getTranslations(languageKey);
		const originalContentAtPath = await fetch(BASE_URL + pathname, fetchOptions);
		return new HTMLRewriter()
			.on('[data-i18n-key]', new ElementHandler(translations))
			.on('[lang]', new LangHandler(languageKey))
			.transform(originalContentAtPath);
	} catch (e) {
		console.error(e);
		return new Response(`Not found`, {
			status: 404,
		});
	}
}


class ElementHandler {
	constructor(countryStrings) {
		this.languageTranslations = countryStrings;
	}

	element(element) {
		const i18nKey = element.getAttribute('data-i18n-key');
		if (i18nKey) {
			const translation = this.languageTranslations[i18nKey];
			if (translation) {
				element.setInnerContent(translation);
			}
		}
	}
}

class LangHandler {
	constructor(language) {
		this.language = language;
	}

	element(element) {
		element.setAttribute('lang', this.language);
	}
}

async function getTranslations(languageKey) {
	return await fetch(`https://cdn.simplelocalize.io/${PROJECT_TOKEN}/${ENVIRONMENT}/${languageKey}`)
		.then(response => response.json())
		.catch(() => ({}));
}
