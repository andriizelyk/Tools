import { useState } from 'react';
import { Button, type ButtonProps } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface Props extends Omit<ButtonProps, 'onClick'> {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label = 'Copy', ...rest }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
      onClick={handleClick}
      disabled={!text}
      {...rest}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}
