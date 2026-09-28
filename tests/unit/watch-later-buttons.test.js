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

	test('confirms with the native snackbar via the page-world bridge', () => {
		const pageCoreJs = fs.readFileSync(path.join(__dirname, '../../js&css/web-accessible/core.js'), 'utf8');

		expect(generalJs).toContain("action: 'show-snackbar'");
		expect(generalJs).not.toContain('yt-show-message-action');
		expect(pageCoreJs).toContain('showSnackbarCommand');
	});

	test('styles hover and always visibility states', () => {
		expect(generalCss).toContain(".it-watch-later-button");
		expect(generalCss).toContain("html[it-watch-later-buttons='hover']");
		expect(generalCss).toContain("html[it-watch-later-buttons='always']");
	});
});
