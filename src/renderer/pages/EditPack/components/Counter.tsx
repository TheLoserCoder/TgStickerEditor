import React from 'react';
import { Flex, Button, TextField } from '@radix-ui/themes';
import { SIDEBAR_CONSTANTS, SIDEBAR_LABELS } from './sidebarConstants';
import styles from './Counter.module.css';

interface CounterProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export const Counter: React.FC<CounterProps> = ({ label, value, min, max, onChange }) => {
  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <Flex direction="column" gap="2">
      <label className={styles.label}>{label}</label>
      <Flex gap="2">
        <Button
          variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE}
          size={SIDEBAR_CONSTANTS.BUTTON_SIZE}
          onClick={handleDecrement}
          disabled={value <= min}
        >
          {SIDEBAR_LABELS.DECREMENT}
        </Button>
        <TextField.Root
          type="number"
          value={value.toString()}
          onChange={handleInputChange}
          min={min}
          max={max}
          className={styles.input}
        />
        <Button
          variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE}
          size={SIDEBAR_CONSTANTS.BUTTON_SIZE}
          onClick={handleIncrement}
          disabled={value >= max}
        >
          {SIDEBAR_LABELS.INCREMENT}
        </Button>
      </Flex>
    </Flex>
  );
};
