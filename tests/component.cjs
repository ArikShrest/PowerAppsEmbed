const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const renderer = require('react-test-renderer');
const { act } = renderer;
const base = 'src/webparts/powerAppsWp/components/';
const timers = new Map();
let nextTimer = 0;
const windowMock = {
  location: { href: 'https://example.com/page?cmId=30&cmApprovalId=40' },
  setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
  clearTimeout: id => timers.delete(id)
};
function load(file, dependencies = {}, sandboxOverrides = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(base + file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.React }
  }).outputText;
  vm.runInNewContext(code, { exports, URL, Error, window: windowMock,
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : name === 'react' ? React : name.endsWith('.png') ? { default: 'welcome.png' } : require(name),
    ...sandboxOverrides
  }, { filename: file });
  return exports;
}
const helpers = load('embedSettings.ts');
const Component = load('PowerAppsWp.tsx', { './embedSettings': helpers, './PowerAppsWp.module.scss': { default: {} } }).default;
const defaults = { appUrl: 'https://apps.powerapps.com/play/app?cmId=[cmId]&cmApprovalId=[cmApprovalId]', paramNames: '', width: '', height: '', isEditMode: true, openPropertyPane: () => {} };
let view;
act(() => { view = renderer.create(React.createElement(Component, defaults)); });
assert.equal(new URL(view.root.findByType('iframe').props.src).searchParams.get('cmId'), '30');
assert.equal(view.root.findByType('iframe').props.style.width, '100%');
assert.equal(view.root.findByType('iframe').props.style.height, '70vh');
assert.equal(view.root.findAllByType('a').length, 0);
assert.equal(timers.size, 1);
act(() => { Array.from(timers.values()).forEach(callback => callback()); });
assert.match(view.root.findByProps({ role: 'status' }).children.join(''), /Taking longer/);
act(() => { view.root.findByType('iframe').props.onLoad(); });
assert.equal(timers.size, 0);
assert.equal(view.root.findAllByProps({ role: 'status' }).length, 0);
act(() => { view.update(React.createElement(Component, { ...defaults, appUrl: 'https://apps.powerapps.com/play/other?record=[cmApprovalId]', width: '800', height: '500px' })); });
assert.equal(new URL(view.root.findByType('iframe').props.src).pathname, '/play/other');
assert.equal(new URL(view.root.findByType('iframe').props.src).searchParams.get('record'), '40');
assert.equal(view.root.findByType('iframe').props.style.width, '800px');
assert.equal(view.root.findByType('iframe').props.style.height, '500px');
assert.match(view.root.findByProps({ role: 'status' }).children.join(''), /Loading/);
assert.equal(timers.size, 1);
act(() => { view.update(React.createElement(Component, { ...defaults, appUrl: 'javascript:alert(1)' })); });
assert.equal(view.root.findAllByType('iframe').length, 0);
assert.equal(view.root.findAllByType('a').length, 0);
assert.equal(view.root.findAllByProps({ role: 'alert' }).length, 1);
assert.equal(timers.size, 0);
act(() => { view.update(React.createElement(Component, { ...defaults, appUrl: '', isEditMode: false })); });
assert.equal(view.root.findAllByType('button').length, 0);
let opened = false;
act(() => { view.update(React.createElement(Component, { ...defaults, appUrl: '', openPropertyPane: () => { opened = true; } })); });
act(() => { view.root.findByType('button').props.onClick(); });
assert.equal(opened, true);
act(() => { view.unmount(); });
assert.equal(timers.size, 0);
console.log('Component settings, loading feedback, CTA removal, responsive defaults, and cleanup checks passed.');

// The custom property-pane fields preserve validation and SPFx change notifications.
let tooltipOpened = 0;
let mountedElement;
let disposed = false;
let helpCounter = 0;
const TooltipStub = props => {
  React.useImperativeHandle(props.componentRef, () => ({ show: () => { tooltipOpened++; }, dismiss: () => {} }));
  return React.createElement('span', { 'data-tooltip': props.content }, props.children);
};
const ButtonStub = props => React.createElement('button', { onClick: props.onClick, 'aria-label': props.ariaLabel, 'aria-describedby': props['aria-describedby'] });
const TextFieldStub = props => React.createElement('div', {},
  props.onRenderLabel({ id: 'sample-input' }, labelProps => React.createElement('label', { htmlFor: labelProps.id }, props.label)),
  React.createElement('input', { value: props.value, onChange: props.onChange }));
const helpModule = load('PropertyPaneHelpTextField.tsx', {
  'react-dom': { render: element => { mountedElement = element; }, unmountComponentAtNode: () => { disposed = true; } },
  '@fluentui/react/lib/TextField': { TextField: TextFieldStub },
  '@fluentui/react/lib/Button': { IconButton: ButtonStub },
  '@fluentui/react/lib/Tooltip': { TooltipHost: TooltipStub, TooltipDelay: { zero: 0 } },
  '@fluentui/react/lib/Utilities': { getId: prefix => prefix + ++helpCounter },
  '@microsoft/sp-property-pane': { PropertyPaneFieldType: { Custom: 1 } }
});
const changes = [];
const validate = value => value === 'bad' ? 'Invalid value' : '';
const field = helpModule.PropertyPaneHelpTextField('width', { label: 'Width', helpText: 'Choose a width.', getValue: () => '800', validate });
assert.equal(field.targetProperty, 'width');
field.properties.onRender({}, undefined, (...args) => changes.push(args));
let fieldView;
act(() => { fieldView = renderer.create(mountedElement); });
assert.equal(fieldView.root.findByType('input').props.value, '800');
assert.equal(fieldView.root.findByType(TextFieldStub).props.description, undefined);
assert.equal(fieldView.root.findByType(TextFieldStub).props.onGetErrorMessage, validate);
assert.equal(fieldView.root.findByType(TooltipStub).props.content, 'Choose a width.');
assert.equal(fieldView.root.findByType('button').props['aria-label'], 'Help for Width');
assert.ok(fieldView.root.findByType('button').props['aria-describedby']);
act(() => { fieldView.root.findByType('button').props.onClick(); });
assert.equal(tooltipOpened, 1);
act(() => { fieldView.root.findByType('input').props.onChange({}, '900'); });
assert.deepEqual(changes.pop(), ['width', '900', true]);
act(() => { fieldView.root.findByType('input').props.onChange({}, 'bad'); });
assert.deepEqual(changes.pop(), ['width', 'bad', false]);
assert.equal(fieldView.root.findByType('input').props.value, 'bad');
act(() => { fieldView.unmount(); });
field.properties.onDispose({});
assert.equal(disposed, true);
console.log('Property-pane tooltip, accessible label, validation, change callback, and disposal checks passed.');

const guideText = fs.readFileSync('src/webparts/powerAppsWp/help/README.md', 'utf8');
const revoked = [];
let guideBlob;
const GuideURL = { createObjectURL: blob => { guideBlob = blob; return 'blob:user-guide'; }, revokeObjectURL: url => revoked.push(url) };
const PanelStub = props => props.isOpen ? React.createElement('section', {}, props.children) : null;
const GuideButtonStub = props => React.createElement('button', { onClick: props.onClick }, props.text);
const guideModule = load('PropertyPaneUserGuide.tsx', {
  'react-dom': { render: () => {}, unmountComponentAtNode: () => {} },
  '@fluentui/react/lib/Button': { DefaultButton: GuideButtonStub },
  '@fluentui/react/lib/Panel': { Panel: PanelStub, PanelType: { large: 1 } },
  '@microsoft/sp-property-pane': { PropertyPaneFieldType: { Custom: 1 } },
  '../help/README.md': { default: guideText },
  './UserGuide.module.scss': { default: {} }
}, { URL: GuideURL, Blob });
let guideView;
act(() => { guideView = renderer.create(React.createElement(guideModule.UserGuide)); });
assert.equal(guideView.root.findByType(PanelStub).props.isOpen, false);
act(() => { guideView.root.findByType('button').props.onClick(); });
assert.equal(guideView.root.findByType(PanelStub).props.isOpen, true);
assert.equal(guideView.root.findByType('a').props.download, 'Power-Apps-Embed-README.md');
assert.equal(guideView.root.findByType('a').props.href, 'blob:user-guide');
assert.equal(guideBlob.type, 'text/markdown;charset=utf-8');
assert.ok(guideView.root.findAllByType('pre').length > 10);
assert.ok(guideText.includes('Use no deep-link parameters'));
assert.ok(guideText.includes('Use one parameter'));
assert.ok(guideText.includes('Support several screen parameters'));
assert.ok(guideText.includes('cmId=[recordId]'));
act(() => { guideView.root.findByType(PanelStub).props.onDismiss(); });
assert.deepEqual(revoked, ['blob:user-guide']);
assert.equal(guideView.root.findAllByType('a').length, 0);
act(() => { guideView.unmount(); });
let safeView;
act(() => { safeView = renderer.create(React.createElement(guideModule.ReadmeContent, { markdown: '# Example\n\n<script>alert(1)</script>\n\n```text\ncmId=[recordId]\n```' })); });
assert.equal(safeView.root.findAllByType('script').length, 0);
assert.equal(safeView.root.findByType('p').children.join(''), '<script>alert(1)</script>');
act(() => { safeView.unmount(); });
console.log('Bundled README opening, download, safe rendering, and cleanup checks passed.');
