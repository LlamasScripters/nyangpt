import { useState } from 'react';
import { ChromePicker } from 'react-color';

const ColorPicker = ({ color, onChange }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState(color || '#000000');

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (color) => {
    setCurrentColor(color.hex);
    onChange(color.hex);
  };

  const styles = {
    color: {
      width: '36px',
      height: '36px',
      borderRadius: '4px',
      background: currentColor,
      cursor: 'pointer',
      border: '1px solid #ccc',
    },
    swatch: {
      padding: '5px',
      background: '#fff',
      borderRadius: '4px',
      boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
      display: 'inline-block',
      cursor: 'pointer',
    },
    popover: {
      position: 'absolute',
      zIndex: '2',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  };

  return (
    <div className="color-picker">
      <div style={styles.swatch} onClick={handleClick}>
        <div style={styles.color} />
      </div>
      {displayColorPicker ? (
        <div style={styles.popover}>
          <div style={styles.cover} onClick={handleClose} />
          <ChromePicker color={currentColor} onChange={handleChange} />
        </div>
      ) : null}
      <input
        type="text"
        value={currentColor}
        onChange={(e) => {
          setCurrentColor(e.target.value);
          onChange(e.target.value);
        }}
        className="color-input"
      />
    </div>
  );
};

export default ColorPicker;