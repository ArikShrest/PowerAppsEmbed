import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { IPropertyPaneField, IPropertyPaneCustomFieldProps, PropertyPaneFieldType } from '@microsoft/sp-property-pane';
import guide from '../help/README.md';
import styles from './UserGuide.module.scss';

// Render the bundled README as text and React elements; never execute embedded HTML.
export function ReadmeContent({ markdown }: { markdown: string }): React.ReactElement {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const key = index;
    if (!line.trim()) { index++; continue; }
    if (line.startsWith('```')) {
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
      index++;
      blocks.push(<pre key={key} tabIndex={0}><code>{code.join('\n')}</code></pre>);
    } else if (/^#{1,3} /.test(line)) {
      const heading = line.match(/^(#{1,3}) (.*)$/);
      if (heading) blocks.push(React.createElement(`h${heading[1].length + 1}`, { key }, heading[2]));
      index++;
    } else if (line.startsWith('- ')) {
      const items: React.ReactNode[] = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(<li key={index}>{lines[index++].slice(2)}</li>);
      }
      blocks.push(<ul key={key}>{items}</ul>);
    } else {
      const paragraph: string[] = [line];
      index++;
      while (index < lines.length && lines[index].trim() && !/^(#{1,3} |```|- )/.test(lines[index])) {
        paragraph.push(lines[index++]);
      }
      blocks.push(<p key={key}>{paragraph.join(' ')}</p>);
    }
  }
  return <div className={styles.readme}>{blocks}</div>;
}

export function UserGuide(): React.ReactElement {
  const [isOpen, setOpen] = React.useState(false);
  const [downloadUrl, setDownloadUrl] = React.useState('');
  React.useEffect(() => {
    if (!isOpen) { setDownloadUrl(''); return; }
    const url = URL.createObjectURL(new Blob([guide], { type: 'text/markdown;charset=utf-8' }));
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isOpen]);
  return <>
    <DefaultButton text="How to use this application" iconProps={{ iconName: 'ReadOutLoud' }}
      onClick={() => setOpen(true)} />
    <Panel isOpen={isOpen} onDismiss={() => setOpen(false)} type={PanelType.large}
      headerText="How to use this application" closeButtonAriaLabel="Close user guide">
      {isOpen && <>
        <p>Setup instructions, deep-link examples, and Power Apps formulas.</p>
        {downloadUrl && <a href={downloadUrl} download="Power-Apps-Embed-README.md">Download README (.md)</a>}
        <ReadmeContent markdown={guide} />
      </>}
    </Panel>
  </>;
}

export function PropertyPaneUserGuide(): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
  return {
    type: PropertyPaneFieldType.Custom,
    targetProperty: '__userGuide',
    properties: {
      key: 'powerAppsUserGuide',
      onRender: element => { ReactDom.render(<UserGuide />, element); },
      onDispose: element => { ReactDom.unmountComponentAtNode(element); }
    }
  };
}
