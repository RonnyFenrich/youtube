const fs = require('fs');
const path = require('path');

describe('Track "Not interested" videos', () => {
	let generalJs;
	let generalCss;

	beforeAll(() => {
		generalJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/www.youtube.com/general/general.js'), 'utf8');
		generalCss = fs.readFileSync(path.join(__dirname, '../../js&css/extension/www.youtube.com/general/general.css'), 'utf8');
	});

	test('registers the feature with init and the General menu', () => {
		const initJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/init.js'), 'utf8');
		const generalSkeleton = fs.readFileSync(path.join(__dirname, '../../menu/skeleton-parts/general.js'), 'utf8');
		const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../_locales/en/messages.json'), 'utf8'));

		expect(initJs).toContain('extension.features.trackNotInterested();');
		expect(generalSkeleton).toContain('track_not_interested');
		expect(messages.trackNotInterested).toBeDefined();
	});

	test('stores the list in extension storage, synced to other tabs by its storage key', () => {
		expect(generalJs).toContain('chrome.storage.local.set({ not_interested_videos: list })');
		// core.js calls extension.features[camelize(key)] on storage changes
		expect(generalJs).toContain('extension.features.notInterestedVideos = function');
	});

	test('shares the hover tracker with the Watch Later button and stacks under it', () => {
		expect(generalJs).toContain('return [extension.features.watchLaterButton, extension.features.trackNotInterested];');
		expect(generalJs).toContain('top += 48;');
	});

	test('re-checks recycled cards when the thumbnail link changes', () => {
		expect(generalJs).toContain("attributeFilter: ['href']");
	});

	test('dims marked cards only while the setting is on', () => {
		expect(generalCss).toContain("html[it-track-not-interested='true'] [it-not-interested]");
		expect(generalCss).toContain('opacity: .2');
	});
});
