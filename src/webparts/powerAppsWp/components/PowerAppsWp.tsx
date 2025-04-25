import * as React from 'react';
import styles from './PowerAppsWp.module.scss';
import type { IPowerAppsWpProps } from './IPowerAppsWpProps';

interface IPowerAppsWpState {
  powerAppsUrl: string;
}

export default class PowerAppsWp extends React.Component<IPowerAppsWpProps, IPowerAppsWpState> {
  constructor(props: IPowerAppsWpProps) {
    super(props);
    
    const resolvedUrl = this.resolveDynamicPlaceholders(this.props.appUrl, this.props.paramNames);
    this.state = {
      powerAppsUrl: resolvedUrl
    };
  }

  private getParameterByName(name: string, url?: string): string | null {
    if (!url) url = window.location.href;
    const params = new URLSearchParams(new URL(url).search);
    return params.get(name);
  }

  private resolveDynamicPlaceholders(appUrl: string, paramNames: string): string {
    if (!appUrl) {
      console.error('App URL is undefined or null');
      return ''; // Return an empty string if the appUrl is not provided
    }
  
    // Optional: Skip if no parameters to replace
    if (!paramNames || paramNames.trim() === '') {
      return appUrl;
    }
  
    let url = appUrl;
    const paramList = paramNames.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
    paramList.forEach(param => {
      const value = this.getParameterByName(param);
      const placeholder = `[${param}]`;
  
      // Only replace placeholders that are found in the URL
      if (url.includes(placeholder)) {
        url = url.split(placeholder).join(encodeURIComponent(value || ''));
      }
    });
  
    return url;
  }
  

  public render(): React.ReactElement<IPowerAppsWpProps> {
    return (
      <div className={styles.powerAppsWp}>
        {this.state.powerAppsUrl ? (
          <iframe 
            width={this.props.width ? `${this.props.width}px` : '600px'}  
            height={this.props.height ? `${this.props.height}px` : '400px'}  
            src={this.state.powerAppsUrl} 
            style={{ 
              background: 'none', 
              backgroundColor: 'transparent', 
              border: 'none', 
              display: 'block',
              width: this.props.width ? `${this.props.width}px` : '600px', 
              height: this.props.height ? `${this.props.height}px` : '400px' 
            }} 
            allowTransparency={true}
          />
        ) : (
          <div style={{ padding: '1em', textAlign: 'center' }}>
          <img 
  alt="Welcome illustration" 
  src={require('../assets/welcome-light.png')} 
  className={styles.placeholderImage} 
/>
          <h2>Custom PowerApps Embed</h2>
          <p>Include a custom business app on your page.</p>
          <button 
  onClick={this.props.openPropertyPane} 
  style={{
    padding: '0.6em 1.2em',
    fontSize: '1em',
    backgroundColor: '#1c355e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1em'
  }}
>
  Add an app
</button>
        </div>
        )}
      </div>
    );
  }
  
}
