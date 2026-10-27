const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/webparts/powerAppsWp/components/embedSettings.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 }
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, URL });
const { resolveAppUrl, resolveDimension, detectParameterNames, validateAppUrl, validateDimension, validateParameterNames } = exportsObject;
const names = ['cmSummaryId', 'cmId', 'cmApprovalId', 'cmResearchId'];
const template = 'https://apps.powerapps.com/play/app?tenantId=fixed&' + names.map(n => `${n}=[${n}]`).join('&');
for (const name of names) {
  const result = new URL(resolveAppUrl(template, names.join(', '), `https://example.com/page?${name}=30`));
  assert.equal(result.searchParams.get(name), '30');
  assert.equal(result.searchParams.get('tenantId'), 'fixed');
  for (const other of names.filter(n => n !== name)) assert.equal(result.searchParams.get(other), '');
}
const special = 'a&b=1+#/ Unicode';
assert.equal(new URL(resolveAppUrl(template, names.join(','), 'https://example.com/?cmId=' + encodeURIComponent(special))).searchParams.get('cmId'), special);
assert.equal(new URL(resolveAppUrl(template, names.join(','), 'https://example.com/?cmId=%5BcmResearchId%5D&cmResearchId=99')).searchParams.get('cmId'), '[cmResearchId]');
for (const bad of ['javascript:alert(1)', 'http://apps.powerapps.com/', 'https://apps.powerapps.com.evil.test/', 'https://evil.test/', 'https://user@apps.powerapps.com/', 'https://apps.powerapps.com:444/', 'https://apps.powerapps.com/[cmId]', 'https://apps.powerapps.com/?id=[unfinished', 'https://apps.powerapps.com/?id=[bad name]', 'https://apps.powerapps.com/?[key]=value', 'https://apps.powerapps.com/%5BcmId%5D']) {
  assert.throws(() => resolveAppUrl(bad, 'cmId', 'https://example.com/?cmId=30'), undefined, bad);
  assert.notEqual(validateAppUrl(bad), '', bad);
}
const manyNames = ['one', 'two', 'three', 'four', 'five', 'six'];
const manyTemplate = 'https://apps.powerapps.com/play/app?' + manyNames.map(n => `${n}=[${n}]`).join('&');
const manyPage = 'https://example.com/?' + manyNames.map((n,i) => `${n}=${i}`).join('&');
const manyResult = new URL(resolveAppUrl(manyTemplate, '', manyPage));
manyNames.forEach((n,i) => assert.equal(manyResult.searchParams.get(n), String(i)));
assert.equal(Array.from(detectParameterNames(manyTemplate)).join(','), manyNames.join(','));
assert.equal(Array.from(detectParameterNames('https://apps.powerapps.com/?a=[id]&b=[id]')).join(','), 'id');
assert.equal(validateAppUrl(template), '');
assert.equal(validateParameterNames('cmId, cmSummaryId'), '');
assert.notEqual(validateParameterNames('cmId,,bad name'), '');
assert.equal(validateParameterNames(''), '');
assert.equal(validateDimension(''), '');
assert.notEqual(validateDimension('-1'), '');
assert.equal(new URL(resolveAppUrl(template, 'oldUnusedName', 'https://example.com/?cmId=77&cmApprovalId=88')).searchParams.get('cmId'), '77');
assert.equal(resolveAppUrl('', '', 'https://example.com/'), '');
const aliasTemplate = 'https://apps.powerapps.com/play/app?tenantId=fixed&cmId=[recordId]';
assert.equal(new URL(resolveAppUrl(aliasTemplate, 'recordId', 'https://example.com/page?recordId=30')).searchParams.get('cmId'), '30');
assert.equal(new URL(resolveAppUrl('https://apps.powerapps.com/play/app?tenantId=fixed', '', 'https://example.com/page?cmId=30')).searchParams.get('cmId'), null);
assert.equal(resolveDimension('800', '600px'), '800px');
assert.equal(resolveDimension('100%', '600px'), '100%');
assert.equal(resolveDimension('80vh', '400px'), '80vh');
for (const bad of ['0', '-1', '100%px', 'expression(alert(1))']) assert.equal(resolveDimension(bad, '600px'), '600px');
console.log('Deep-link, URL validation, encoding, and dimension checks passed.');
