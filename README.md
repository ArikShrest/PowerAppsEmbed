# Power Apps Embed web part

An SPFx web part for embedding a canvas app in SharePoint Online with query-string deep links.

## Development

Use **Node 22.14.0 or newer within Node 22**, SPFx **1.23.2**, and React/React DOM **17.0.1**. React is pinned to the version supported by this SPFx release. The project now uses Heft; the old Gulp runner and isolated Node 18 runtime are no longer needed.

```powershell
npm ci --ignore-scripts
npm test
npm run build
npm start
```

`npm start` serves HTTPS on port 4321 and opens the SharePoint development page in `config/serve.json`. Sign into your tenant and approve loading debug scripts if prompted. If the development certificate is not trusted, run `npm run trust-dev-cert` and accept the certificate prompt. Use `npm start -- --nobrowser` to run without launching a browser.

## Configure the web part

| Setting | Behavior |
| --- | --- |
| App URL | HTTPS URL on `apps.powerapps.com`. Put placeholders such as `[cmId]` in query parameter values. |
| Width | Optional positive pixels or CSS units, such as `800`, `800px`, `100%`, or `40rem`. Defaults to the column width. The app is centered when narrower than the column, and explicit widths are capped at the container width on small screens. |
| Height | Optional positive pixels or CSS units, such as `600`, `600px`, or `70vh`. Defaults to 70% of the viewport height. |
| Parameter Names | Optional legacy setting retained for existing pages. Placeholder names are detected automatically; no manual list is required. |

Hover over, focus, or tap the information icon beside each field label to see its help text. Validation errors still appear directly below the fields in the settings panel. Existing saved App URL, width, height, and parameter-list properties remain compatible. Existing explicit dimensions are respected.

Example App URL:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID&cmId=[cmId]&cmSummaryId=[cmSummaryId]&cmResearchId=[cmResearchId]&cmApprovalId=[cmApprovalId]
```

Example SharePoint page link:

```text
https://TENANT.sharepoint.com/sites/Branches/SitePages/ComplaintManagement.aspx?cmId=30
```

The iframe receives `cmId=30`. Power Apps uses `Param("cmId")` to choose the screen or record. There is no fixed number of placeholders. Multiple page parameters are forwarded together, missing values become empty strings, and values are safely encoded. Fixed URL values such as tenant ID are preserved. Use only one `?` to start the query string; separate subsequent parameters with `&`.

Click **How to use this application** in the configuration panel to open the bundled README, including no-parameter, one-parameter, and multiple-parameter examples, recordId mapping, and App.OnStart / App.StartScreen formulas. Download the same README from the guide. Its source is [the user guide](src/webparts/powerAppsWp/help/README.md). Loading feedback appears while the iframe loads; after 20 seconds it suggests refreshing the page or contacting the app owner. Cross-origin browser rules prevent the web part from confirming whether authentication inside Power Apps succeeded. No separate open-in-new-tab CTA is shown.

Embedding does not grant access to the app or its data. Share the app and configure data-source permissions separately. Record IDs from the page URL are user-controlled; authorize access in the data source. Power Apps controls precedence when multiple deep links are supplied.

## Production package

```powershell
npm run package
```

The command performs a clean production build and creates `sharepoint/solution/power-apps-wp.sppkg`, solution version **1.0.9.0**. Upload it to your app catalog to replace the existing solution. Test authentication, each deep link, and multiple simultaneous parameters in your tenant before production rollout. Component and solution IDs are preserved.

## Tests and security checks

- `npm test`: deep-link resolution, more than four placeholders, missing and simultaneous values, special-character encoding, destination validation, sizing, configuration updates, loading timers, CTA removal, and cleanup.
- `npm run lint`: SPFx ESLint rules.
- `npm run audit`: npm advisory scan, failing on high or critical findings. Includes development dependencies.
- `.github/workflows/validate.yml`: Node 22 tests, lint, production packaging, and dependency scanning on pushes, pull requests, manual runs, and weekly schedules.
- `.github/dependabot.yml`: weekly dependency and GitHub Actions update checks. React updates are held for coordinated SPFx upgrades.

The GitHub workflows run after this project is pushed to a GitHub repository with Actions enabled. No publishing or tenant deployment occurs in CI. Security overrides in `package.json` retain fixes for the previously reported dependency advisories; review them during future SPFx upgrades. A passing targeted dependency check is not a claim that the entire dependency tree has no advisories.

The migration audit on October 27, 2026 reported zero high or critical findings, eight moderate findings, and three low findings. All remaining findings were in development dependencies. The raw results are saved in `audit-review.json`.

## Migration notes

The migration replaces Gulp with the SPFx Heft rig, updates all SPFx packages together, adopts the ESLint flat configuration, and uses the system Node 22 installation. An upgrade analysis and the previous local dependency tree were retained under ignored `.tools/` for reference in this workspace. They are not required for a fresh checkout.
