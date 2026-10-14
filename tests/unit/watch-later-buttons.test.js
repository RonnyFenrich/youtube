const fs = require('fs');
const path = require('path');

describe('Watch Later thumbnail buttons', () => {
	let generalJs;
	let generalCss;
	let generalSkeleton;

	beforeAll(() => {
		generalJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/www.youtube.com/general/general.js'), 'utf8');
		generalCss = fs.readFileSync(path.join(__dirname, '../../js&css/extension/www.youtube.com/general/general.css'), 'utf8');
		generalSkeleton = fs.readFileSync(path.join(__dirname, '../../menu/skeleton-parts/general.js'), 'utf8');
	});

	test('registers the feature with init', () => {
		const initJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/init.js'), 'utf8');

		expect(initJs).toContain('extension.features.watchLaterButtons();');
		expect(generalJs).toContain('extension.features.watchLaterButtons');
	});

	test('adds a hover and always menu option', () => {
		expect(generalSkeleton).toContain('watch_later_buttons');
		expect(generalSkeleton).toContain("value: 'hover'");
		expect(generalSkeleton).toContain("value: 'always'");
	});

	test('adds via Innertube only, never clicking the native toggle', () => {
		expect(generalJs).not.toContain('findNativeWatchLaterButton');
		expect(generalJs).not.toContain('nativeButton.click();');
		expect(generalJs).toContain('ACTION_ADD_VIDEO');
		expect(generalJs).toContain("playlistId: 'WL'");
	});

	test('thumbnail button is one shared element that stays visible under the hover preview', () => {
		expect(generalJs).toContain('extension.features.watchLaterButton.show = function');
		expect(generalJs).toContain("target.closest('ytd-video-preview')");
		expect(generalCss).not.toContain('*:hover>.it-thumb-wl-button');
	});

	test('confirms with a single short-lived toast that replaces the previous one', () => {
		const pageCoreJs = fs.readFileSync(path.join(__dirname, '../../js&css/web-accessible/core.js'), 'utf8');

		expect(generalJs).toContain("extension.features.thumbnailButtons.toast('Saved to Watch later', videoId);");
		expect(generalJs).toContain('feature.toastElement.remove();');
		expect(generalJs).toContain('}, 1000);');
		expect(generalCss).toContain('.it-thumb-toast');
		expect(pageCoreJs).not.toContain('showSnackbarCommand');
	});

	test('styles hover and always visibility states', () => {
		expect(generalCss).toContain(".it-watch-later-button");
		expect(generalCss).toContain("html[it-watch-later-buttons='hover']");
		expect(generalCss).toContain("html[it-watch-later-buttons='always']");
	});

	test('W shortcut adds the hovered thumbnail, only while the button is on', () => {
		const shortcutsJs = fs.readFileSync(path.join(__dirname, '../../js&css/web-accessible/www.youtube.com/shortcuts.js'), 'utf8');
		const initJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/init.js'), 'utf8');

		expect(shortcutsJs).toContain("if (this.storage.watch_later_button === true) defaults.shortcut_add_to_watch_later = {keys: {87: {key: 'w'}}};");
		expect(shortcutsJs).toContain("this.messages.send({action: 'add-watch-later'});");
		expect(initJs).toContain('extension.features.watchLaterButton.addHovered();');
		expect(fs.readFileSync(path.join(__dirname, '../../menu/skeleton-parts/shortcuts.js'), 'utf8')).toContain('shortcut_add_to_watch_later');
	});

	test('thumbnail button turns green for videos already in Watch Later', () => {
		expect(generalJs).toContain("button.classList.toggle('it-thumb-wl-active', this.videos.has(");
		expect(generalCss).toContain('.it-thumb-wl-button.it-thumb-wl-active');
	});
});
