const fs = require('fs');
const path = require('path');

describe('Track seen videos', () => {
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

		expect(initJs).toContain('extension.features.trackSeenVideos();');
		expect(generalSkeleton).toContain('track_seen_videos');
		expect(messages.trackSeenVideos).toBeDefined();
	});

	test('stores the list in extension storage, synced to other tabs by its storage key', () => {
		expect(generalJs).toContain('chrome.storage.local.set({ seen_videos: list })');
		// core.js calls extension.features[camelize(key)] on storage changes
		expect(generalJs).toContain('extension.features.seenVideos = function');
	});

	test('shares the hover tracker with the Watch Later button and stacks under it', () => {
		expect(generalJs).toContain('return [extension.features.watchLaterButton, extension.features.trackSeenVideos];');
		expect(generalJs).toContain('top += 48;');
	});

	test('re-checks recycled cards when the thumbnail link changes', () => {
		expect(generalJs).toContain("attributeFilter: ['href']");
	});

	test('dims marked cards only while the setting is on', () => {
		expect(generalCss).toContain("html[it-track-seen-videos='true'] [it-seen]");
	});

	test('dims Watch Later videos from a fetched, in-memory list, tied to the Watch Later button setting', () => {
		expect(generalJs).toContain("page({ browseId: 'VLWL' })");
		expect(generalJs).toContain('page({ continuation: token })');
		expect(generalJs).not.toContain('watch_later_videos');
		expect(generalJs).toContain('extension.features.watchLaterButton.refresh = function');
		expect(generalJs).toContain('extension.features.watchLaterButton.added(videoId);');
		expect(generalCss).toContain("html[it-watch-later-button='true'] [it-in-watch-later]");
		expect(generalCss).toContain('opacity: .7');
	});

	test('marks saved videos seen and checks Watch Later first when dimming', () => {
		expect(generalJs).toContain('extension.features.trackSeenVideos.set(videoId, true);');
		expect(generalJs).toContain('seen = !watchLater && ');
	});

	test('marks videos seen when they leave Watch Later', () => {
		const appearanceJs = fs.readFileSync(path.join(__dirname, '../../js&css/web-accessible/www.youtube.com/appearance.js'), 'utf8');
		const initJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/init.js'), 'utf8');

		expect(appearanceJs).toContain("ImprovedTube.messages.send({action: 'removed-from-watch-later', videoId: params.get('v')});");
		expect(initJs).toContain('extension.features.watchLaterButton.removed(message.videoId);');
		expect(generalJs).toContain('this.videos.delete(videoId);');
		expect(generalJs).toContain('if (!ids.has(videoId)) {');
	});

	test('S shortcut toggles the hovered thumbnail, only while the feature is on', () => {
		const shortcutsJs = fs.readFileSync(path.join(__dirname, '../../js&css/web-accessible/www.youtube.com/shortcuts.js'), 'utf8');
		const pageCoreJs = fs.readFileSync(path.join(__dirname, '../../js&css/web-accessible/core.js'), 'utf8');
		const initJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/init.js'), 'utf8');
		const shortcutsSkeleton = fs.readFileSync(path.join(__dirname, '../../menu/skeleton-parts/shortcuts.js'), 'utf8');

		expect(shortcutsJs).toContain("if (this.storage.track_seen_videos === true) defaults.shortcut_mark_seen = {keys: {83: {key: 's'}}};");
		expect(shortcutsJs).toContain("this.messages.send({action: 'toggle-seen'});");
		expect(pageCoreJs).toContain("case 'trackSeenVideos':");
		expect(initJs).toContain('extension.features.trackSeenVideos.toggleHovered();');
		expect(shortcutsSkeleton).toContain('shortcut_mark_seen');
		expect(generalJs).toContain('extension.features.trackSeenVideos.toggleHovered = function');
	});
});
