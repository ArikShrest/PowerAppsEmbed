import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'PowerAppsWpWebPartStrings';
import PowerAppsWp from './components/PowerAppsWp';
import { IPowerAppsWpProps } from './components/IPowerAppsWpProps';
import { detectParameterNames, validateAppUrl, validateDimension, validateParameterNames } from './components/embedSettings';
import { PropertyPaneHelpTextField } from './components/PropertyPaneHelpTextField';
import { PropertyPaneUserGuide } from './components/PropertyPaneUserGuide';


export interface IPowerAppsWpWebPartProps {
  description: string;
  appUrl: string;
  width: string;
  height: string;
  paramNames: string;
}

export default class PowerAppsWpWebPart extends BaseClientSideWebPart<IPowerAppsWpWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IPowerAppsWpProps> = React.createElement(
      PowerAppsWp,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        appUrl: this.properties.appUrl,
        width: this.properties.width,
        height: this.properties.height,
        paramNames: this.properties.paramNames,
        isEditMode: this.displayMode === DisplayMode.Edit,
        openPropertyPane: () => this.context.propertyPane.open()
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    }).catch(() => {
      this._environmentMessage = strings.UnknownEnvironment;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams':
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }
          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) return;

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    if (propertyPath === 'appUrl') this.context.propertyPane.refresh();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    let detectedNames: string[] = [];
    try {
      detectedNames = detectParameterNames(this.properties.appUrl);
    } catch {
      // The URL field displays the validation error.
    }
    return {
      pages: [
        {
          header: {
            description: 'Display a Power Apps canvas app on this page and pass page URL values to open a specific screen or record.'
          },
          groups: [
            { groupName: 'Help', groupFields: [PropertyPaneUserGuide()] },
            {
              groupName: 'App settings',
              groupFields: [
                PropertyPaneHelpTextField('appUrl', {
                  getValue: () => this.properties.appUrl,
                  label: "App URL",
                  multiline: true,
                  rows: 5,
                  helpText: 'Paste the app web link from Power Apps (https://apps.powerapps.com/play/...). Keep fixed values such as tenantId. For deep links, add query values such as &recordId=[recordId]; the value will come from this SharePoint page URL.',
                  validate: validateAppUrl
                }),
                PropertyPaneHelpTextField('width', {
                  getValue: () => this.properties.width,
                  label: "Width",
                  helpText: 'Set the app width: 800 means 800 pixels; 80% uses 80% of the SharePoint column. A narrower app is centered automatically and will shrink to fit smaller screens. Leave blank to fill the column.',
                  validate: validateDimension
                }),
                PropertyPaneHelpTextField('height', {
                  getValue: () => this.properties.height,
                  label: "Height",
                  helpText: 'Set the app height: 600 means 600 pixels; 70vh uses 70% of the browser window height. Leave blank to use 70vh. Choose enough height to show your app comfortably.',
                  validate: validateDimension
                }),
                PropertyPaneHelpTextField('paramNames', {
                  getValue: () => this.properties.paramNames,
                  label: 'Parameter Names (optional)',
                  helpText: `You can leave this blank: names are detected from [placeholders] in the App URL. Existing comma-separated lists, such as recordId,screenName, are kept for compatibility. Detected names: ${detectedNames.join(', ') || 'none'}.`,
                  validate: validateParameterNames
                })
              ]
            }

          ]
        }
      ]
    };
  }
}
