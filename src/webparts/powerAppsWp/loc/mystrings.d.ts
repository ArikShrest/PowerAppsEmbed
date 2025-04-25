declare interface IPowerAppsWpWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
  AppUrlFieldLabel: string; // Label for the App URL field
  WidthFieldLabel: string; // Label for the Width field
  HeightFieldLabel: string; // Label for the Height field
  ParamNameFieldLabel: string;
}

declare module 'PowerAppsWpWebPartStrings' {
  const strings: IPowerAppsWpWebPartStrings;
  export = strings;
}
