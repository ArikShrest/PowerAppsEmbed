import * as React from 'react';
import * as ReactDom from 'react-dom';
import { TextField } from '@fluentui/react/lib/TextField';
import { IconButton } from '@fluentui/react/lib/Button';
import { TooltipHost, TooltipDelay, ITooltipHost } from '@fluentui/react/lib/Tooltip';
import { getId } from '@fluentui/react/lib/Utilities';
import { IPropertyPaneField, IPropertyPaneCustomFieldProps, PropertyPaneFieldType } from '@microsoft/sp-property-pane';

interface IHelpTextFieldProps {
  label: string;
  helpText: string;
  value: string;
  multiline?: boolean;
  rows?: number;
  validate: (value: string) => string;
  onChange: (value: string, valid: boolean) => void;
}

export function HelpTextField(props: IHelpTextFieldProps): React.ReactElement {
  const [value, setValue] = React.useState(props.value);
  const [helpId] = React.useState(() => getId('powerAppsFieldHelp'));
  const tooltip = React.useRef<ITooltipHost>(null);
  React.useEffect(() => setValue(props.value), [props.value]);
  return <TextField label={props.label} value={value} multiline={props.multiline} rows={props.rows}
    onGetErrorMessage={props.validate} deferredValidationTime={300}
    onChange={(_event, newValue) => {
      const nextValue = newValue || '';
      setValue(nextValue);
      props.onChange(nextValue, !props.validate(nextValue));
    }}
    onRenderLabel={(labelProps, renderLabel) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {renderLabel && renderLabel(labelProps)}
        <TooltipHost id={helpId} content={props.helpText} componentRef={tooltip} delay={TooltipDelay.zero}
          calloutProps={{ gapSpace: 4 }} styles={{ root: { display: 'inline-block' } }}>
          <IconButton iconProps={{ iconName: 'Info' }} ariaLabel={`Help for ${props.label}`}
            aria-describedby={helpId} type="button" onClick={() => tooltip.current?.show()}
            styles={{ root: { width: 28, height: 28 }, icon: { fontSize: 16 } }} />
        </TooltipHost>
      </div>
    )} />;
}

interface IHelpTextFieldOptions {
  label: string;
  helpText: string;
  getValue: () => string;
  multiline?: boolean;
  rows?: number;
  validate: (value: string) => string;
}

export function PropertyPaneHelpTextField(targetProperty: string, options: IHelpTextFieldOptions): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
  return {
    type: PropertyPaneFieldType.Custom,
    targetProperty,
    properties: {
      key: `help-${targetProperty}`,
      onRender: (element, _context, changeCallback) => {
        ReactDom.render(<HelpTextField label={options.label} helpText={options.helpText}
          value={options.getValue() || ''} multiline={options.multiline} rows={options.rows}
          validate={options.validate}
          onChange={(value, valid) => changeCallback?.(targetProperty, value, valid)} />, element);
      },
      onDispose: element => { ReactDom.unmountComponentAtNode(element); }
    }
  };
}
