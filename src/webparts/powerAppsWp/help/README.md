# How to use Power Apps Embed

## What this web part does

This web part displays a Power Apps canvas app inside a SharePoint page. It can pass values from the SharePoint page URL into the app to open a screen or load a record. Power Apps decides how those values are used; the web part does not navigate screens itself.

## 1. Configure the App URL

In Power Apps, open your app's Details and copy its Web link. Paste that Power Apps link into the web part's App URL field. Do not paste the SharePoint page link there.

Use your real environment ID, app ID, and tenant ID in place of ENVIRONMENT_ID, APP_ID, and TENANT_ID below. Keep the other fixed parameters supplied by Power Apps if your link needs them.

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID
```

The URL must use HTTPS on apps.powerapps.com. Use one ? to start the query string and & between additional parameters. In the configured App URL only, square brackets mark values to read from the SharePoint page, for example cmId=[cmId].

Width and Height are optional. Width defaults to the SharePoint column width; enter 800 for 800 pixels or 80% for 80% of the column. Narrower app frames are centered. Height defaults to 70vh, meaning 70% of the browser window height; enter 600 for a fixed height of 600 pixels.

## 2. Use no deep-link parameters

App URL:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID
```

Parameter Names: leave blank. Open this SharePoint page normally:

```text
https://[Domain].sharepoint.com/sites/Dev/SitePages/Complaint-Management.aspx
```

The app receives no custom record parameters. With the StartScreen formula below, it opens DashBoardScreen. The OnStart example initializes a new complaint form, but StartScreen still determines the initial screen.

## 3. Use one parameter

To open complaint 30 on FormScreen, set App URL to:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID&cmId=[cmId]
```

Parameter Names: you may enter cmId, or leave it blank because placeholders are detected automatically. Share this actual page link:

```text
https://[Domain].sharepoint.com/sites/Dev/SitePages/Complaint-Management.aspx?cmId=30
```

The iframe's resolved Power Apps URL is:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID&cmId=30
```

Inside Power Apps, Param("cmId") returns the text "30". Use Value(Param("cmId")) when a numeric record ID is required. Match parameter spelling and capitalization exactly.

## 4. Support several screen parameters

Configure a single App URL that supports all four routes:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID&cmId=[cmId]&cmSummaryId=[cmSummaryId]&cmResearchId=[cmResearchId]&cmApprovalId=[cmApprovalId]
```

Parameter Names: leave blank, or retain this comma-separated list (without brackets):

```text
cmId,cmSummaryId,cmResearchId,cmApprovalId
```

The list is retained for compatibility with older versions. It does not create parameters or rename them: placeholders in App URL determine the values forwarded. There is no fixed four-parameter limit.

Use one of these page links, depending on the screen you want:

```text
Complaint-Management.aspx?cmId=30          -> FormScreen
Complaint-Management.aspx?cmSummaryId=30   -> SummaryScreen
Complaint-Management.aspx?cmResearchId=30  -> ResearchScreen
Complaint-Management.aspx?cmApprovalId=30  -> OverviewScreen
```

For the summary link, the embedded URL becomes:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID&cmId=&cmSummaryId=30&cmResearchId=&cmApprovalId=
```

Missing parameters become empty strings. You can also pass several independent values in one page link:

```text
Complaint-Management.aspx?cmId=30&source=Branches
```

To forward source as well, add &source=[source] to App URL. In Power Apps use Param("source"). If you keep a manual list, it can be cmId,cmSummaryId,cmResearchId,cmApprovalId,source.

## 5. Passing more than one screen selector

You can pass multiple values, for example:

```text
Complaint-Management.aspx?cmId=30&cmApprovalId=45
```

Both values are forwarded. The web part does not choose a winner. Prefer sending one screen selector per link. If your app accepts several selectors, use the same priority in OnStart and StartScreen.

In your original formulas, separate OnStart If statements mean the last positive parameter wins (cmApprovalId has the highest priority). StartScreen instead takes the first positive parameter (cmId has the highest priority). The example above can therefore open FormScreen but load record 45. The recommended formulas below consistently use the first positive selector: cmId, then cmSummaryId, then cmResearchId, then cmApprovalId.

## 6. Using recordId instead of cmId

The link ?recordId=[recordId] is a template, not a finished link. Before sharing it, replace the placeholder with an actual value:

```text
https://[Domain].sharepoint.com/sites/Dev/SitePages/Complaint-Management.aspx?recordId=30
```

Your current Power Apps formulas read cmId, cmSummaryId, cmResearchId, and cmApprovalId. They do not read recordId. To keep the formulas unchanged, map the page parameter to cmId in App URL:

```text
https://apps.powerapps.com/play/e/ENVIRONMENT_ID/a/APP_ID?tenantId=TENANT_ID&cmId=[recordId]
```

The web part reads recordId=30 from SharePoint and sends cmId=30 to Power Apps. Parameter Names may be blank, or recordId. The name inside brackets identifies the SharePoint page value; the query key before = identifies what Power Apps receives. Alternatively, use recordId=[recordId] in App URL and change your Power Apps formulas to Param("recordId").

## 7. Power Apps: App.StartScreen

Select App in the Power Apps tree and set its StartScreen property. These screen names are examples from your application; change them if your app uses different names. Read Param directly here rather than global variables initialized by OnStart.

```powerfx
If(
    IfError(Value(Param("cmId")), 0) > 0, FormScreen,
    IfError(Value(Param("cmSummaryId")), 0) > 0, SummaryScreen,
    IfError(Value(Param("cmResearchId")), 0) > 0, ResearchScreen,
    IfError(Value(Param("cmApprovalId")), 0) > 0, OverviewScreen,
    DashBoardScreen
)
```

IfError prevents a nonnumeric URL value from becoming an unhandled conversion error. Blank, zero, or negative IDs are not treated as valid record selectors.

## 8. Power Apps: App.OnStart

Use OnStart to select the record and initialize app variables. Merge this example into your app's existing initialization; do not replace unrelated setup. Data sources, controls, nf_NavigationTabs, and the Office365Users connection below must exist in your app. Use the real control names without the formatting asterisks shown in copied chat text.

```powerfx
// Clear deep-link state before selecting a record.
Set(varParamId, Blank());
Set(varCurrentTab, Blank());
Set(varSelectedItem, Blank());
Set(varcm_ResearchRecord, Blank());
Set(varcm_ApprovalTracker, Blank());
Set(varManager, Blank());
Clear(colAttachment);

// First positive selector wins, matching StartScreen.
With(
    {
        detailId: IfError(Value(Param("cmId")), 0),
        summaryId: IfError(Value(Param("cmSummaryId")), 0),
        researchId: IfError(Value(Param("cmResearchId")), 0),
        approvalId: IfError(Value(Param("cmApprovalId")), 0)
    },
    Set(
        varParamId,
        If(
            detailId > 0, detailId,
            summaryId > 0, summaryId,
            researchId > 0, researchId,
            approvalId > 0, approvalId,
            Blank()
        )
    );
    Set(
        varCurrentTab,
        If(
            detailId > 0, nf_NavigationTabs.varDetails,
            summaryId > 0, nf_NavigationTabs.varIntakeSummary,
            researchId > 0, nf_NavigationTabs.varResearch,
            approvalId > 0, nf_NavigationTabs.varOverview,
            Blank()
        )
    )
);

If(
    !IsBlank(varParamId),
    Set(varSelectedItem, LookUp(cm_ComplaintDB, ID = varParamId));
    If(
        !IsBlank(varSelectedItem),
        Set(varMenuSelected, 1);
        Set(
            varcm_ResearchRecord,
            LookUp(cm_ComplaintSurvey, cm_Id.Value = Text(varSelectedItem.ID))
        );
        Set(
            varcm_ApprovalTracker,
            LookUp(cm_ApprovalTracker, cm_Id.Value = Text(varSelectedItem.ID))
        );
        Set(
            varManager,
            IfError(
                Office365Users.ManagerV2(varSelectedItem.AssignedDepartmentLead.Email),
                Blank()
            )
        );
        Set(varFormMode, "Edit");
        ViewForm(form_Complaint);
        EditForm(form_Survey);
        ClearCollect(
            colAttachment,
            Filter(cm_ComplaintLibrary, cm_Id.Value = Text(varSelectedItem.ID))
        ),
        Set(varFormMode, "View");
        ViewForm(form_Complaint);
        Notify("Warning Note", NotificationType.Warning)
    ),
    Set(varFormMode, "New");
    NewForm(form_Complaint)
);
```

Bind form_Complaint.Item to varSelectedItem and bind related forms to their matching record variables as appropriate. A valid ID can select an initial screen even if the record lookup later returns blank; show an empty or access-denied state instead of allowing edits to another record. For data-source errors, add IfError handling appropriate to your app.

OnStart can still be running while the initial screen appears. If a screen needs the loaded record immediately, display a loading state and disable record actions until initialization completes. Do not rely on global variables created in OnStart inside StartScreen. These formulas are examples for you to review and test in Power Apps; this web part does not modify or publish your app.

## 9. Building a finished page link in Power Apps

For a gallery item whose ID is 30, a button can open the details page using:

```powerfx
Launch(
    "https://[Domain].sharepoint.com/sites/Dev/SitePages/Complaint-Management.aspx?cmId=" & Text(ThisItem.ID)
)
```

Use cmSummaryId, cmResearchId, or cmApprovalId in the link to choose another screen. For arbitrary text values use EncodeUrl when assembling query values. To change deep links, navigate to the new SharePoint page URL or reload it so the iframe starts with the new parameters.

## 10. Publish and test

- Save and publish the Power App after changing its formulas.
- Save and publish the SharePoint page after changing the web part settings.
- Test the base page with no parameters, then each selector with a real accessible record ID.
- Test a missing or invalid ID, and any simultaneous parameters you intentionally support.
- Share the app and its data sources with intended users. Embedding does not grant access.
- Record IDs in URLs are user-controlled. Enforce authorization in the data source; filtering by ID is not an access-control rule.

## Microsoft references

Launch and Param: https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-param

App.OnStart and App.StartScreen: https://learn.microsoft.com/en-us/power-platform/power-fx/reference/object-app
