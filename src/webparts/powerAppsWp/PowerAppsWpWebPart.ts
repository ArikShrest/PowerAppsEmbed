import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'PowerAppsWpWebPartStrings';
import PowerAppsWp from './components/PowerAppsWp';
import { IPowerAppsWpProps } from './components/IPowerAppsWpProps';


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
        openPropertyPane: () => this.context.propertyPane.open()
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
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

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupFields: [
                PropertyPaneTextField('appUrl', {
                  label: "App URL",
                  multiline: true,
                  rows: 5,
                  description: "Use [parameterName] in the URL as a placeholder. Example: https://apps.powerapps.com/play/...?paramName1=[paramName1]&paramName2=[paramName2]" // optional, sets visible height
                }),
                PropertyPaneTextField('width', {
                  label: "Width"
                }),
                PropertyPaneTextField('height', {
                  label: "Height"
                }),
                PropertyPaneTextField('paramNames', {
                  label: "Parameter Names (comma-separated)",
                  description: "Comma-separated list of query string keys to replace. Example: paramName1, paramName2"
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
