import * as React from 'react';
import styles from './PowerAppsWp.module.scss';
import type { IPowerAppsWpProps } from './IPowerAppsWpProps';
import { resolveAppUrl, resolveDimension } from './embedSettings';
import welcomeImage from '../assets/welcome-light.png';

interface IEmbeddedAppProps { url: string; width: string; height: string; }

function EmbeddedApp({ url, width, height }: IEmbeddedAppProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);
  const [delayed, setDelayed] = React.useState(false);
  React.useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setDelayed(true), 20000);
    return () => window.clearTimeout(timeout);
  }, [loading]);
  return (
    <div className={styles.appContainer}>
      {loading && <div className={styles.appStatus} role="status" aria-live="polite">
        {delayed ? 'Taking longer than expected. If the app does not appear, refresh the page or contact the app owner.' : 'Loading app…'}
      </div>}
      <iframe title="Power Apps application" src={url}
        onLoad={() => setLoading(false)}
        style={{ width: resolveDimension(width, '100%'), height: resolveDimension(height, '70vh') }} />
    </div>
  );
}

export default class PowerAppsWp extends React.Component<IPowerAppsWpProps> {
  public render(): React.ReactElement<IPowerAppsWpProps> {
    let appUrl = '';
    let error = '';
    try {
      appUrl = resolveAppUrl(this.props.appUrl, this.props.paramNames, window.location.href);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'The app URL is invalid.';
    }
    return (
      <div className={styles.powerAppsWp}>
        {appUrl ? <EmbeddedApp key={appUrl} url={appUrl} width={this.props.width} height={this.props.height} /> : (
          <div className={styles.placeholder}>
            <img alt="" src={welcomeImage} className={styles.placeholderImage} />
            <h2>Custom PowerApps Embed</h2>
            {error ? <p role="alert">{error}</p> : <p>Include a custom business app on your page.</p>}
            {this.props.isEditMode && <button type="button" onClick={this.props.openPropertyPane}>
              {error ? 'Configure app' : 'Add an app'}
            </button>}
          </div>
        )}
      </div>
    );
  }
}
