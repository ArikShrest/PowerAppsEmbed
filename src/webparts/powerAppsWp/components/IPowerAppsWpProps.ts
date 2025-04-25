
export interface IPowerAppsWpProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  appUrl: string;
  width: string;
  height: string;
  paramNames: string;
  openPropertyPane: () => void;

}
