import React from 'react';
import createReactHardwareComponentClass from '../createReactHardwareComponentClass';
import modes from './inputModes';
import HardwareManager from '../HardwareManager';
import ReactHardwareEventEmitter from '../ReactHardwareEventEmitter';
import findNodeHandle from '../findNodeHandle';

var DOWN_EVENT = 'topDown';
var UP_EVENT = 'topUp';
var CHANGE_EVENT = 'topChange';
var HOLD_EVENT = 'topHold';

var EVENT_TYPE = {
  [DOWN_EVENT]: 'down',
  [UP_EVENT]: 'up',
  [CHANGE_EVENT]: 'change',
  [HOLD_EVENT]: 'hold',
};

var BUTTON_REF = 'button';

var viewConfig = {
  uiViewClassName: 'Button',
  validAttributes: {
    pin: true,
    mode: true,

    onHold: true,
    onChange: true,
    onDown: true,
    onUp: true,
  },
};

function emitEvent(componentInstance, eventName, value) {
  ReactHardwareEventEmitter.receiveEvent(
    findNodeHandle(componentInstance),
    eventName,
    {
      value: value,
      target: componentInstance,
      type: EVENT_TYPE[eventName],
    }
  );
}

class Button extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      isDown: false,
      inverted: props.inverted || false,
    };
  }

  componentWillMount() {
    // random private data that shouldn’t trigger a render
    this._timer = null;
  }

  componentDidMount() {
    var value = null;
    // set up the hardware polling
    HardwareManager.read(findNodeHandle(this.refs[BUTTON_REF]), newValue => {
      if (newValue !== value) {
        // TODO: add support for inverted buttons like johnny-five.
        var eventName = newValue === 0 ? UP_EVENT : DOWN_EVENT;
        emitEvent(this, eventName, newValue);
        emitEvent(this, CHANGE_EVENT, newValue);

        if (eventName === DOWN_EVENT) {
          this._timer = setTimeout(
            _ => emitEvent(this, HOLD_EVENT, newValue),
            this.props.holdtime
          );
        }
        else {
          this._timer = clearTimeout(this._timer);
        }

        value = newValue;
      }
    });
  }

  render() {
    var props = Object.assign({}, this.props);

    return (
      <Hardware
        ref={BUTTON_REF}
        mode={modes.INPUT}
        {...props} />
    );
  }
}

var Hardware = createReactHardwareComponentClass(viewConfig);

Button.defaultProps = {
  holdtime: 1000,
};

export default Button;

