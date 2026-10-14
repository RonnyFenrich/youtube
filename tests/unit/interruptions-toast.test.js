const fs = require('fs');
const path = require('path');
const vm = require('vm');

const generalJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/www.youtube.com/general/general.js'), 'utf8');

function extractFeature() {
	const start = generalJs.indexOf('extension.features.hideInterruptionsToast = function () {');
	const end = generalJs.indexOf('# FONT', start);

	return generalJs.slice(start, generalJs.lastIndexOf('/*', end));
}

function setup(enabled) {
	const observers = [];
	const frames = [];
	const containers = [];
	const context = {
		extension: {
			features: {},
			storage: { get: key => key === 'hide_interruptions_toast' ? enabled : undefined }
		},
		document: {
			documentElement: {},
			querySelectorAll: selector => selector === 'snackbar-container' ? containers : []
		},
		requestAnimationFrame: callback => frames.push(callback),
		MutationObserver: class {
			constructor(callback) {
				this.callback = callback;
				this.connected = false;
				observers.push(this);
			}

			observe() {
				this.connected = true;
			}

			disconnect() {
				this.connected = false;
			}
		}
	};

	vm.runInNewContext(extractFeature(), context);

	return {
		context,
		observers,
		feature: context.extension.features.hideInterruptionsToast,
		addContainer(text) {
			const container = {
				textContent: text,
				attributes: new Set(),
				toggleAttribute(name, force) {
					this.attributes[force ? 'add' : 'delete'](name);
				}
			};

			containers.push(container);

			return container;
		},
		mutate() {
			observers.forEach(observer => observer.connected && observer.callback([]));
			frames.splice(0).forEach(frame => frame());
		},
		setEnabled(value) {
			enabled = value;
		}
	};
}

describe('Hide "Experiencing interruptions?" toasts', () => {
	test('is registered with init, the General menu and the locale', () => {
		const initJs = fs.readFileSync(path.join(__dirname, '../../js&css/extension/init.js'), 'utf8');
		const generalSkeleton = fs.readFileSync(path.join(__dirname, '../../menu/skeleton-parts/general.js'), 'utf8');
		const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../_locales/en/messages.json'), 'utf8'));
		const generalCss = fs.readFileSync(path.join(__dirname, '../../js&css/extension/www.youtube.com/general/general.css'), 'utf8');

		expect(initJs).toContain('extension.features.hideInterruptionsToast();');
		expect(generalSkeleton).toContain('hide_interruptions_toast');
		expect(messages.hideInterruptionsToast.message).toContain('Experiencing interruptions?');
		expect(generalCss).toContain('snackbar-container[it-interruptions-toast]');
	});

	test('hides only the interruptions snackbar and unhides the container for the next one', () => {
		const t = setup(true);

		t.feature();

		const container = t.addContainer('Experiencing interruptions?');

		t.mutate();
		expect(container.attributes.has('it-interruptions-toast')).toBe(true);

		container.textContent = 'Saved to Watch later';
		t.mutate();
		expect(container.attributes.has('it-interruptions-toast')).toBe(false);
	});

	test('does nothing while off, and unhides when turned off', () => {
		const t = setup(false);
		const container = t.addContainer('Experiencing interruptions?');

		t.feature();
		t.mutate();
		expect(t.observers).toHaveLength(0);
		expect(container.attributes.has('it-interruptions-toast')).toBe(false);

		t.setEnabled(true);
		t.feature();
		expect(container.attributes.has('it-interruptions-toast')).toBe(true);

		t.setEnabled(false);
		t.feature();
		expect(t.observers[0].connected).toBe(false);
		expect(container.attributes.has('it-interruptions-toast')).toBe(false);
	});
});
